"""
University Result PDF Parser
Extracts student data from Mumbai University result PDFs
"""

import pdfplumber
import re
import json
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class SubjectMark:
    code: str
    name: str
    credits: float
    internal: Optional[int] = None
    external: Optional[int] = None
    term_work: Optional[int] = None
    oral: Optional[int] = None
    internal_grace: int = 0
    external_grace: int = 0
    term_work_grace: int = 0
    oral_grace: int = 0
    total: Optional[int] = None
    grade: Optional[str] = None
    grade_points: Optional[float] = None
    passed: bool = True

@dataclass
class Student:
    seat_no: str
    name: str
    status: str
    gender: str
    ern: str
    college: str
    subjects: List[SubjectMark]
    total_marks: int
    max_marks: int = 0
    cgpa: float = 0.0
    result: str = "FAILED"

def extract_course_metadata(page) -> Dict[str, dict]:
    """Extract course info from page 1 (subject codes, names, credits, max marks).
    Also determines which components (I1, E1, T1, O1) each subject has
    by checking if the corresponding columns have numeric values (not '...').
    Expected column layout (13 cols):
      0: Code, 1: Title, 2: Credits,
      3: I1 Min, 4: I1 Max, 5: E1 Min, 6: E1 Max,
      7: T1 Min, 8: T1 Max, 9: O1 Min, 10: O1 Max,
      11: Total Min, 12: Total Max
    """
    tables = page.extract_tables()
    courses = {}
    
    if tables:
        for table in tables:
            for row in table[2:]:  # Skip header rows
                if row and row[0] and row[0].strip().isdigit():
                    code = row[0].strip()
                    name = row[1].strip() if len(row) > 1 and row[1] else ""
                    credits = float(row[2]) if len(row) > 2 and row[2] and row[2] != '...' else 0
                    max_marks = float(row[-1]) if row[-1] and row[-1] != '...' else 0
                    
                    # Determine which components this subject has
                    # A component is present if its Max Marks column is numeric (not '...')
                    def has_component(col_idx):
                        if len(row) > col_idx and row[col_idx]:
                            val = row[col_idx].strip()
                            return val != '...' and val.replace('.', '', 1).isdigit()
                        return False
                    
                    courses[code] = {
                        'name': name,
                        'credits': credits,
                        'max_marks': max_marks,
                        'has_i1': has_component(4),   # I1 Max Marks column
                        'has_e1': has_component(6),   # E1 Max Marks column
                        'has_t1': has_component(8),   # T1 Max Marks column
                        'has_o1': has_component(10),  # O1 Max Marks column
                    }
    return courses

def extract_exam_info(page) -> Dict[str, str]:
    """Extract exam metadata (Program, Semester, Scheme, Date) from page 1 header"""
    text = page.extract_text()
    if not text:
        return {}
    
    # Try to find the exam header line
    # Format: OFFICE REGISTER FOR THE ... ( Semester - X ) ( Scheme ) EXAMINATION HELD IN ...
    info = {
        'program': 'Unknown Program',
        'semester': 'Unknown Semester',
        'scheme': 'Unknown Scheme',
        'examination': 'Unknown Examination'
    }
    
    # Clean up text to single line for easier regex
    clean_text = ' '.join(text.split()[:200]) # Look at first 200 words
    
    # Extract Program - capture everything until " ( Semester"
    prog_match = re.search(r'OFFICE REGISTER FOR THE\s+(.+?)\s*\(\s*Semester', clean_text, re.IGNORECASE)
    if prog_match:
        info['program'] = prog_match.group(1).strip()
        
    # Extract Semester
    sem_match = re.search(r'\(\s*Semester\s*-\s*([IVX]+)\s*\)', clean_text, re.IGNORECASE)
    if sem_match:
        info['semester'] = f"Sem {sem_match.group(1)}"
        
    # Extract Scheme
    scheme_match = re.search(r'\(\s*(NEP[^)]*)\s*\)', clean_text, re.IGNORECASE)
    if scheme_match:
        info['scheme'] = scheme_match.group(1).strip()
        
    # Extract Exam Date
    date_match = re.search(r'EXAMINATION HELD IN\s+([A-Z]+\s+\d{4})', clean_text, re.IGNORECASE)
    if date_match:
        info['examination'] = date_match.group(1).strip()
        
    return info

def parse_student_block(lines: List[str], course_metadata: Dict) -> Optional[Student]:
    """Parse a block of lines belonging to one student"""
    
    if not lines:
        return None
    
    # First line: seat_no, name, status, gender, ern, college
    header_line = lines[0]
    
    # Try Pattern 1: seat_no NAME Regular MALE (ERN) COLLEGE
    seat_match = re.match(r'^(\d{7})\s+(.+?)\s+(Regular|Repeater)\s+(MALE|FEMALE)\s+\(([^)]+)\)\s+(.+)$', header_line)
    
    if seat_match:
        seat_no = seat_match.group(1)
        name = seat_match.group(2).strip()
        status = seat_match.group(3)
        gender = seat_match.group(4)
        ern = seat_match.group(5)
        college = seat_match.group(6).strip()
    else:
        # Try Pattern 2: seat_no NAME Regular MALE COLLEGE (ERN on separate line)
        seat_match = re.match(r'^(\d{7})\s+(.+?)\s+(Regular|Repeater)\s+(MALE|FEMALE)\s+(.+)$', header_line)
        
        if not seat_match:
            return None
        
        seat_no = seat_match.group(1)
        name = seat_match.group(2).strip()
        status = seat_match.group(3)
        gender = seat_match.group(4)
        college = seat_match.group(5).strip()
        ern = ""
        
        # Look for ERN in subsequent lines (usually in parentheses)
        for line in lines[1:5]:  # Check first few lines
            ern_match = re.search(r'\(?(MU\d+)\)?', line)
            if ern_match:
                ern = ern_match.group(1)
                break
    
    # Initialize data containers
    t1_marks = []  # Term Work
    o1_marks = []  # Oral
    e1_marks = []  # External
    i1_marks = []  # Internal
    tot_data = []  # Totals with grades
    total_marks = 0
    result = "FAILED"
    cgpa = 0.0
    
    # Parse remaining lines
    for line in lines[1:]:
        line = line.strip()
        
        # Helper to extract marks handling ABS, + (carried forward), and @N (grace marks)
        def extract_marks(text_line):
            # Matches: (digits)(optional +) (optional @grace) followed by (optional +) (P or 0 F...) OR (ABS)
            # Examples: '21 P', '21 + P', '21 @3 P', '16 + @2 P', 'ABS', '8 0 F 0.0'
            matches = re.findall(r'(?:(\d+)\+?\s+(?:@(\d+)\s+)?\+?\s*(?:P|0\s+F\s+[\d.]+)|(ABS))', text_line)
            result = []
            for m in matches:
                if m[2]:  # ABS
                    result.append({'mark': 'ABS', 'grace': 0})
                else:
                    result.append({'mark': int(m[0]), 'grace': int(m[1]) if m[1] else 0})
            return result

        # T1 line (Term Work): T1 18 P ... or T1 ABS ...
        if line.startswith('T1 '):
            t1_marks = extract_marks(line)
        
        # O1 line (Oral): O1 11 P ...
        elif line.startswith('O1 '):
            o1_marks = extract_marks(line)
        
        # E1 line (External): E1 8 0 F ... or ABS
        elif line.startswith('E1 '):
            e1_marks = extract_marks(line)
            
            # Extract total marks: (375) or similar
            marks_match = re.search(r'MARKS\s*$', line)
        
        # I1 line (Internal): I1 11 0 F ...
        elif line.startswith('I1 '):
            i1_marks = extract_marks(line)
            
            # Try to extract result and total marks - may be on same line
            result_match = re.search(r'\((\d+)\)\s*(FAILED|PASSED|PASS)?', line)
            if result_match:
                total_marks = int(result_match.group(1))
                if result_match.group(2):
                    result = "PASS" if "PASS" in result_match.group(2) else "FAILED"
        
        # Handle "FAILED" or "PASS" on its own line (or partial like "FAILE")
        elif 'FAILED' in line or 'FAILE' in line:
            if total_marks > 0:  # Only set if we already have marks
                result = "FAILED"
        elif line.strip() == 'PASS' or line.strip() == 'PASSED':
            if total_marks > 0:
                result = "PASS"
        
        # TOT line: subject totals with grades
        elif line.startswith('TOT '):
            # Pattern: TOT 37 0 F 3 0.0 (total grade_point grade credits cxg)
            # or: TOT 65+ 0 F 3 0.0 46 7 B+ 2 14.0...
            # Total can be digits(optional +) or ... (ellipsis for carried-forward subjects)
            # Extract all subject totals: (marks, grade_point, grade, credits, cxg)
            tot_pattern = r'(?:(\d+)\+?|\.\.\.?)\s+(\d+)\s+([A-Z+]+|F)\s+([\d.]+)\s+([\d.]+)'
            tot_matches = re.findall(tot_pattern, line)
            for match in tot_matches:
                tot_data.append({
                    'total': int(match[0]) if match[0] else None,
                    'grade_point': int(match[1]),
                    'grade': match[2],
                    'credits': float(match[3]),
                    'cxg': float(match[4])
                })
            
            # Extract CGPA from end of TOT line (format: ... 23 159.5 6.93478)
            # The pattern is: total_credits sum_cxg cgpa
            cgpa_match = re.search(r'\d+\s+[\d.]+\s+([\d.]+)\s*$', line)
            if cgpa_match:
                try:
                    candidate = float(cgpa_match.group(1))
                    # CGPA must be between 0 and 10 — if not, it's likely
                    # the sum_cxg value from a line that was split by pdfplumber
                    if 0 <= candidate <= 10:
                        cgpa = candidate
                except:
                    pass
        
        # Standalone CGPA line (just a decimal number)
        elif re.match(r'^[\d.]+$', line):
            try:
                val = float(line)
                # CGPA should be between 0 and 10
                if 0 <= val <= 10:
                    cgpa = val
            except:
                pass
    # Build subject marks with DYNAMIC component mapping from course_metadata
    # The metadata table on page 1 tells us which components each subject has
    subjects = []
    subject_codes = list(course_metadata.keys())  # Dynamic: use codes from metadata
    
    # Build dynamic component-to-subject mapping from metadata
    # For each component type, collect which subject codes (in order) have that component
    t1_subject_codes = [c for c in subject_codes if course_metadata[c].get('has_t1', False)]
    o1_subject_codes = [c for c in subject_codes if course_metadata[c].get('has_o1', False)]
    e1_subject_codes = [c for c in subject_codes if course_metadata[c].get('has_e1', False)]
    i1_subject_codes = [c for c in subject_codes if course_metadata[c].get('has_i1', False)]
    
    # Create index trackers for each component
    t1_idx = 0
    o1_idx = 0
    e1_idx = 0
    i1_idx = 0
    
    for i, code in enumerate(subject_codes):
        meta = course_metadata.get(code, {'name': f'Subject {code}', 'credits': 0, 'max_marks': 0})
        
        subject = SubjectMark(
            code=code,
            name=meta['name'],
            credits=meta['credits'],
        )
        
        # Assign component marks based on dynamic metadata
        # T1 (Term Work)
        if code in t1_subject_codes and t1_idx < len(t1_marks):
            entry = t1_marks[t1_idx]
            subject.term_work = entry['mark'] if entry['mark'] != 'ABS' else None
            subject.term_work_grace = entry['grace']
            t1_idx += 1
        
        # O1 (Oral)
        if code in o1_subject_codes and o1_idx < len(o1_marks):
            entry = o1_marks[o1_idx]
            subject.oral = entry['mark'] if entry['mark'] != 'ABS' else None
            subject.oral_grace = entry['grace']
            o1_idx += 1
        
        # E1 (External)
        if code in e1_subject_codes and e1_idx < len(e1_marks):
            entry = e1_marks[e1_idx]
            subject.external = entry['mark'] if entry['mark'] != 'ABS' else None
            subject.external_grace = entry['grace']
            e1_idx += 1
        
        # I1 (Internal)
        if code in i1_subject_codes and i1_idx < len(i1_marks):
            entry = i1_marks[i1_idx]
            subject.internal = entry['mark'] if entry['mark'] != 'ABS' else None
            subject.internal_grace = entry['grace']
            i1_idx += 1
        
        # Assign totals and grades from tot_data if available
        if i < len(tot_data):
            subject.total = tot_data[i]['total']
            subject.grade = tot_data[i]['grade']
            subject.grade_points = tot_data[i]['grade_point']
            subject.passed = tot_data[i]['grade'] != 'F'
        
        subjects.append(subject)
    
    return Student(
        seat_no=seat_no,
        name=name,
        status=status,
        gender=gender,
        ern=ern,
        college=college,
        subjects=subjects,
        total_marks=total_marks,
        cgpa=cgpa,
        result=result
    )

def parse_pdf(pdf_path: str) -> Dict:
    """Main function to parse the entire PDF"""
    
    students = []
    students = []
    course_metadata = {}
    exam_info = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        # Page 1: Extract course metadata and exam info
        if pdf.pages:
            course_metadata = extract_course_metadata(pdf.pages[0])
            exam_info = extract_exam_info(pdf.pages[0])
        
        # Calculate total max marks from metadata (sum of all subject max marks)
        total_max_marks = int(sum(m['max_marks'] for m in course_metadata.values()))
        
        # Build a set of subject codes for filtering page headers
        subject_code_set = set(course_metadata.keys())
        
        # Generic skip patterns for page headers and footers
        skip_keywords = [
            'SEAT NO', 'University Of Mumbai', 'PAGE :', '#:', 'ADC:',
            '%Marks', 'Grade O', 'GRADE POINT', 'NEP 2020',
            'TERM WORK', 'ORAL (', 'External (', 'Internal(',
            'TOT GP', 'õC', 'õCG',
        ]
        
        def is_subject_header_line(line):
            """Check if a line is a repeated page header listing subject codes.
            These look like: '10411 : Applied 10412 : Applied Physics ...'
            or continuation lines like: 'Mathematics-I (TERM ...'
            """
            # Subject code header: starts with a known subject code
            first_token = line.split()[0] if line.split() else ''
            if first_token.rstrip(':') in subject_code_set:
                return True
            return False
        
        # Pages 2+: Extract student data
        for page_num, page in enumerate(pdf.pages[1:], start=2):
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            
            # Find student record start (7-digit seat number at start of line)
            current_block = []
            
            for line in lines:
                # Check if this is a new student record
                if re.match(r'^\d{7}\s+[A-Z]', line):
                    # Process previous block if exists
                    if current_block:
                        student = parse_student_block(current_block, course_metadata)
                        if student:
                            student.max_marks = total_max_marks
                            students.append(student)
                    current_block = [line]
                elif current_block:
                    # Skip header lines, footer lines, and subject header lines
                    if not any(skip in line for skip in skip_keywords):
                        if not is_subject_header_line(line):
                            current_block.append(line)
            
            # Don't forget the last block
            if current_block:
                student = parse_student_block(current_block, course_metadata)
                if student:
                    student.max_marks = total_max_marks
                    students.append(student)
    
    # Calculate statistics
    total_students = len(students)
    passed_students = [s for s in students if s.result == "PASS"]
    pass_percentage = (len(passed_students) / total_students * 100) if total_students > 0 else 0
    
    # Calculate median CGPA
    cgpas = [s.cgpa for s in students if s.cgpa > 0]
    cgpas.sort()
    median_cgpa = cgpas[len(cgpas) // 2] if cgpas else 0
    
    # Find subject toppers
    subject_toppers = {}
    for code in course_metadata.keys():
        max_marks = 0
        topper = None
        for student in students:
            for subject in student.subjects:
                if subject.code == code and subject.total and subject.total > max_marks:
                    max_marks = subject.total
                    topper = {'seat_no': student.seat_no, 'name': student.name, 'marks': max_marks}
        if topper:
            subject_toppers[code] = topper
            
    # Calculate College Statistics
    college_stats = {}
    
    # Group students by college
    college_map = {}
    for student in students:
        # Extract short college name for grouping key if needed, or use full string
        # Using full string for exactness
        c_name = student.college
        if c_name not in college_map:
            college_map[c_name] = []
        college_map[c_name].append(student)
        
    for c_name, c_students in college_map.items():
        c_total = len(c_students)
        c_passed = len([s for s in c_students if s.result == "PASS"])
        c_pass_pct = (c_passed / c_total * 100) if c_total > 0 else 0
        
        # Subject-wise stats for this college
        c_subjects = {}
        for code in course_metadata.keys():
            s_passed = 0
            s_failed = 0
            s_total_subj = 0
            
            for s in c_students:
                # Find subject in student's list
                subj = next((sub for sub in s.subjects if sub.code == code), None)
                if subj:
                    s_total_subj += 1
                    if subj.passed:
                        s_passed += 1
                    else:
                        s_failed += 1
            
            # Only include if students actually took this subject
            if s_total_subj > 0:
                c_subjects[code] = {
                    'name': course_metadata[code]['name'],
                    'total': s_total_subj,
                    'passed': s_passed,
                    'failed': s_failed,
                    'pass_percentage': round((s_passed / s_total_subj * 100), 2)
                }
        
        college_stats[c_name] = {
            'total_students': c_total,
            'passed_students': c_passed,
            'failed_students': c_total - c_passed,
            'pass_percentage': round(c_pass_pct, 2),
            'subject_stats': c_subjects
        }
    
    return {
        'exam_info': exam_info,
        'course_metadata': course_metadata,
        'students': [asdict(s) for s in students],
        'statistics': {
            'total_students': total_students,
            'passed_students': len(passed_students),
            'pass_percentage': round(pass_percentage, 2),
            'median_cgpa': round(median_cgpa, 2),
            'subject_toppers': subject_toppers,
            'college_statistics': college_stats
        }
    }

def main():
    """Test the parser with the sample PDF"""
    pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"
    
    result = parse_pdf(pdf_path)
    
    # Print summary
    print(f"\n{'='*60}")
    print("PARSING RESULTS")
    print(f"{'='*60}")
    print(f"Total Students: {result['statistics']['total_students']}")
    print(f"Passed Students: {result['statistics']['passed_students']}")
    print(f"Pass Percentage: {result['statistics']['pass_percentage']}%")
    print(f"Median CGPA: {result['statistics']['median_cgpa']}")
    
    print(f"\n{'='*60}")
    print("FIRST 5 STUDENTS:")
    print(f"{'='*60}")
    for student in result['students'][:5]:
        print(f"  {student['seat_no']}: {student['name']} - {student['total_marks']} marks - {student['result']}")
    
    # Save to JSON
    output_path = Path(pdf_path).parent / "parsed_results.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\nFull results saved to: {output_path}")

if __name__ == "__main__":
    main()
