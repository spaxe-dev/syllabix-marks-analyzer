from parse_results import parse_pdf

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"
r = parse_pdf(pdf_path)

print(f"Total students: {len(r['students'])}")

s = [x for x in r['students'] if x['seat_no'] == '1311072']
if s:
    print(f"FOUND: {s[0]['name']} - {s[0]['total_marks']} marks - {s[0]['result']} - CGPA: {s[0]['cgpa']}")
else:
    print("NOT FOUND: 1311072")
    
# Check pass rate
print(f"\nPass rate: {r['statistics']['pass_percentage']}%")
print(f"Total: {r['statistics']['total_students']}, Passed: {r['statistics']['passed_students']}")
