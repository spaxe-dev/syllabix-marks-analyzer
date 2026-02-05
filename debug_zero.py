from parse_results import parse_pdf

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"
r = parse_pdf(pdf_path)

# Find students with 0 marks
zero_mark_students = [s for s in r['students'] if s['total_marks'] == 0]

print(f"Total students: {len(r['students'])}")
print(f"Students with 0 marks: {len(zero_mark_students)}")

print(f"\n{'='*80}")
print("STUDENTS WITH 0 MARKS:")
print(f"{'='*80}")

for s in zero_mark_students:
    print(f"{s['seat_no']}: {s['name']}")
    print(f"  College: {s['college']}")
    print(f"  Result: {s['result']}")
    print()

# Also show colleges
print(f"\n{'='*80}")
print("UNIQUE COLLEGES:")
print(f"{'='*80}")
colleges = set(s['college'] for s in r['students'])
for c in sorted(colleges):
    count = len([s for s in r['students'] if s['college'] == c])
    print(f"  {count:3d} students - {c[:70]}")
