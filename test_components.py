from parse_results import parse_pdf

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"
r = parse_pdf(pdf_path)

# Check a specific student's component marks
student = next((s for s in r['students'] if s['seat_no'] == '1311072'), None)

if student:
    print(f"Student: {student['name']}")
    print(f"\nSubject Component Marks:")
    print(f"{'Subject':<30} {'T1':>5} {'O1':>5} {'E1':>5} {'I1':>5} {'Total':>6} {'Grade':>6}")
    print("-" * 75)
    for subj in student['subjects']:
        t1 = subj.get('term_work') or '-'
        o1 = subj.get('oral') or '-'
        e1 = subj.get('external') or '-'
        i1 = subj.get('internal') or '-'
        total = subj.get('total') or '-'
        grade = subj.get('grade') or '-'
        name = subj['name'][:28] if subj['name'] else subj['code']
        print(f"{name:<30} {t1:>5} {o1:>5} {e1:>5} {i1:>5} {total:>6} {grade:>6}")
