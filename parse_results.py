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
    max_marks: int = 800
    cgpa: float = 0.0
    result: str = "FAILED"

def extract_course_metadata(page) -> Dict[str, dict]:
    """Extract course info from page 1 (subject codes, names, credits, max marks)"""
    tables = page.extract_tables()
    courses = {}
    
    if tables:
        for table in tables:
            for row in table[2:]:  # Skip header rows
                if row and row[0] and row[0].isdigit():
                    code = row[0]
                    name = row[1] if len(row) > 1 else ""
                    credits = float(row[2]) if len(row) > 2 and row[2] and row[2] != '...' else 0
                    max_marks = float(row[-1]) if row[-1] and row[-1] != '...' else 0
                    courses[code] = {
                        'name': name,
                        'credits': credits,
                        'max_marks': max_marks
                    }
    return courses

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
        
        # Helper to extract marks handling ABS
        def extract_marks(text_line):
            # Matches: (digits) followed by (P or 0 F...) OR (ABS)
            matches = re.findall(r'(?:(\d+)\s+(?:P|0\s+F\s+[\d.]+)|(ABS))', text_line)
            # Return int for digits, string for ABS
            return [int(m[0]) if m[0] else "ABS" for m in matches]

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
            # or: TOT 65 0 F 3 0.0 46 7 B+ 2 14.0...
            # Extract all subject totals: (marks, grade_point, grade, credits, cxg)
            tot_pattern = r'(\d+)\s+(\d+)\s+([A-Z+]+|F)\s+([\d.]+)\s+([\d.]+)'
            tot_matches = re.findall(tot_pattern, line)
            for match in tot_matches:
                tot_data.append({
                    'total': int(match[0]),
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
                    cgpa = float(cgpa_match.group(1))
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
    # Build subject marks with component mapping
    # Subject structure varies - need to map components correctly
    # T1 (Term Work): subjects 10411, 10412, 10413, 10414, 10415, 10416, 10417, 10418, 10419, 10421, 10422, 10423 (in order they appear)
    # O1 (Oral): subjects 10418, 10419, 10423 (labs with oral)
    # E1 (External): subjects 10411, 10412, 10413, 10414, 10415, 10420 (theory subjects)
    # I1 (Internal): subjects 10411, 10412, 10413, 10414, 10415, 10420, 10424 (theory + induction)
    
    subjects = []
    subject_codes = ['10411', '10412', '10413', '10414', '10415', '10416', '10417', 
                     '10418', '10419', '10420', '10421', '10422', '10423', '10424']
    
    # Define which subjects have which components (in order of appearance in T1/O1/E1/I1 lines)
    # T1 appears for: 10411, 10412, 10413, 10414, 10415, 10416, 10417, 10421, 10422 (9 subjects usually)
    # But actual order may vary - we use positional mapping based on tot_data order
    t1_subjects = ['10411', '10412', '10413', '10414', '10415', '10416', '10417', '10421', '10422']
    o1_subjects = ['10418', '10419', '10423']
    e1_subjects = ['10411', '10412', '10413', '10414', '10415', '10420']
    i1_subjects = ['10411', '10412', '10413', '10414', '10415', '10420', '10424']
    
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
        
        # Assign component marks based on subject type
        # T1 (Term Work) - most theory and some lab subjects
        if t1_idx < len(t1_marks):
            subject.term_work = t1_marks[t1_idx]
            t1_idx += 1
        
        # Assign totals and grades from tot_data if available
        if i < len(tot_data):
            subject.total = tot_data[i]['total']
            subject.grade = tot_data[i]['grade']
            subject.grade_points = tot_data[i]['grade_point']
            subject.passed = tot_data[i]['grade'] != 'F'
        
        subjects.append(subject)
    
    # Now assign O1, E1, I1 marks based on subject type
    # O1 goes to labs with oral (10418, 10419, 10423)
    o1_target_indices = [7, 8, 12]  # indices in subject_codes for 10418, 10419, 10423
    for idx, subj_idx in enumerate(o1_target_indices):
        if idx < len(o1_marks) and subj_idx < len(subjects):
            subjects[subj_idx].oral = o1_marks[idx]
    
    # E1 goes to theory subjects (10411-10415, 10420)
    e1_target_indices = [0, 1, 2, 3, 4, 9]  # indices for 10411-10415, 10420
    for idx, subj_idx in enumerate(e1_target_indices):
        if idx < len(e1_marks) and subj_idx < len(subjects):
            subjects[subj_idx].external = e1_marks[idx]
    
    # I1 goes to theory subjects + 10424 (10411-10415, 10420, 10424)
    i1_target_indices = [0, 1, 2, 3, 4, 9, 13]  # indices for 10411-10415, 10420, 10424
    for idx, subj_idx in enumerate(i1_target_indices):
        if idx < len(i1_marks) and subj_idx < len(subjects):
            subjects[subj_idx].internal = i1_marks[idx]
    
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
    course_metadata = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        # Page 1: Extract course metadata
        if pdf.pages:
            course_metadata = extract_course_metadata(pdf.pages[0])
        
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
                            students.append(student)
                    current_block = [line]
                elif current_block:
                    # Skip header lines and footer lines
                    if not any(skip in line for skip in ['SEAT NO', 'University Of Mumbai', 'PAGE :', '#:', 'ADC:', '%Marks', 'Grade O', 'GRADE POINT', 'NEP 2020']):
                        if not line.startswith('10411') and not line.startswith('10412'):
                            current_block.append(line)
            
            # Don't forget the last block
            if current_block:
                student = parse_student_block(current_block, course_metadata)
                if student:
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
