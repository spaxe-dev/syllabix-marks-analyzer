from parse_results import parse_pdf
import sys

# CS PDF path
pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

try:
    print("Parsing PDF...")
    r = parse_pdf(pdf_path)
    
    # Find Deepraj
    student = next((s for s in r['students'] if '1141100' in s['seat_no']), None)
    
    if student:
        print(f"\nStudent: {student['name']}")
        print(f"Total: {student['total_marks']}")
        print(f"\nSubject Component Marks:")
        print(f"{'Subject':<30} {'T1':>5} {'O1':>5} {'E1':>5} {'I1':>5}")
        print("-" * 60)
        for subj in student['subjects']:
            t1 = str(subj.get('term_work') or '-')
            o1 = str(subj.get('oral') or '-')
            e1 = str(subj.get('external') or '-')
            i1 = str(subj.get('internal') or '-')
            name = subj['name'][:28] if subj['name'] else subj['code']
            print(f"{name:<30} {t1:>5} {o1:>5} {e1:>5} {i1:>5}")
    else:
        print("Student not found!")

except Exception as e:
    print(f"Error: {e}")
