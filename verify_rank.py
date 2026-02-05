from parse_results import parse_pdf

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"
r = parse_pdf(pdf_path)

# Sort all students by total marks (descending)
students = sorted(r['students'], key=lambda x: x['total_marks'], reverse=True)

print(f"Total students: {len(students)}")
print(f"\n{'='*70}")
print(f"TOP 30 STUDENTS BY MARKS:")
print(f"{'='*70}")
print(f"{'Rank':<6} {'Seat No':<10} {'Name':<35} {'Marks':<8} {'Result'}")
print(f"{'-'*70}")

for i, s in enumerate(students[:30], 1):
    print(f"{i:<6} {s['seat_no']:<10} {s['name'][:33]:<35} {s['total_marks']:<8} {s['result']}")

# Find 1311072 specifically  
print(f"\n{'='*70}")
print(f"YOUR POSITION (1311072):")
print(f"{'='*70}")

for i, s in enumerate(students, 1):
    if s['seat_no'] == '1311072':
        print(f"Rank: {i} out of {len(students)}")
        print(f"Name: {s['name']}")
        print(f"Marks: {s['total_marks']} / 800")
        print(f"CGPA: {s['cgpa']}")
        print(f"Result: {s['result']}")
        
        # Calculate percentile
        students_below = len([x for x in students if x['total_marks'] < s['total_marks']])
        percentile = (students_below / len(students)) * 100
        print(f"Percentile: {percentile:.1f}%")
        break
