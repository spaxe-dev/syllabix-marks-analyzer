
import csv
import json
import re
from pathlib import Path
import parse_results  # This imports the existing logic

def filter_students(students, college_keyword):
    filtered = []
    print(f"Filtering {len(students)} students for keyword '{college_keyword}'...")
    for s in students:
        # Check college field
        # The parser extracts college string.
        if college_keyword.lower() in s['college'].lower():
            filtered.append(s)
    return filtered

def flatten_student(s):
    # Flatten subject marks
    flat = {
        'Seat No': s['seat_no'],
        'Name': s['name'],
        'Branch': s.get('branch', 'Unknown'),  # Added Branch
        'Gender': s['gender'],
        'Status': s['status'],
        'ERN': s['ern'],
        'College': s['college'],
        'Total Marks': s['total_marks'],
        'CGPA': s['cgpa'],
        'Result': s['result'],
    }
    
    # Sort subjects by code to ensure column alignment
    sorted_subjects = sorted(s['subjects'], key=lambda x: x['code'])
    
    for subj in sorted_subjects:
        code = subj['code']
        # We'll use the code as prefix
        flat[f'{code}_TermWork'] = subj['term_work']
        flat[f'{code}_Theory'] = subj['external'] # 'external' is usually theory
        flat[f'{code}_Internal'] = subj['internal']
        flat[f'{code}_Oral'] = subj['oral'] 
        flat[f'{code}_Total'] = subj['total']
        flat[f'{code}_Grade'] = subj['grade']
        flat[f'{code}_GradePts'] = subj['grade_points']
        
    return flat

def main():
    # Map file paths to Branch names
    files = [
        (r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf", "CSE"),
        (r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf", "EE")
    ]
    
    all_students = []
    
    for pdf_file, branch in files:
        if not Path(pdf_file).exists():
            print(f"File not found: {pdf_file}")
            continue
            
        print(f"Parsing {pdf_file} for branch {branch}...")
        try:
            result = parse_results.parse_pdf(pdf_file)
            print(f"Found {len(result['students'])} students in {Path(pdf_file).name}")
            
            # Inject branch info
            for student in result['students']:
                student['branch'] = branch
                
            all_students.extend(result['students'])
        except Exception as e:
            print(f"Error parsing {pdf_file}: {e}")
            import traceback
            traceback.print_exc()

    # Filter for MAEER's MIT (1331)
    target_students = filter_students(all_students, "1331")
    
    if not target_students:
        print("No students found with '1331'. Trying 'MAEER'...")
        target_students = filter_students(all_students, "MAEER")
        
    print(f"Total target students found: {len(target_students)}")
    
    if not target_students:
        print("No students found matching the criteria.")
        return

    # Flatten data for CSV
    flat_data = [flatten_student(s) for s in target_students]
    
    # Determine all CSV headers (superset of keys)
    headers = list(flat_data[0].keys())
    # Ensure standard columns come first
    std_cols = ['Seat No', 'Name', 'Branch', 'Gender', 'Status', 'ERN', 'College', 'Total Marks', 'CGPA', 'Result']
    
    # Remove std cols from headers to re-add them in order
    for c in std_cols:
        if c in headers:
            headers.remove(c)
    
    final_headers = std_cols + headers
    
    # Write to CSV
    output_file = r"d:\Projects\stats\MAEER_MIT_Students.csv"
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=final_headers)
        writer.writeheader()
        writer.writerows(flat_data)
        
    print(f"Successfully saved data to {output_file}")

if __name__ == "__main__":
    main()
