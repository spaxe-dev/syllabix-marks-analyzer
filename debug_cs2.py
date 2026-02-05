import pdfplumber
import re

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Get course metadata from page 1
    page1 = pdf.pages[0]
    text1 = page1.extract_text()
    print("PAGE 1 - COURSE INFO:")
    print("="*80)
    for line in text1.split('\n'):
        print(line)
    
    # Now analyze the TOT line for 1141182
    print("\n\n" + "="*80)
    print("ANALYZING STUDENT 1141182 TOT LINE:")
    print("="*80)
    
    tot_line = "TOT 98 8 A 3 24.0 60 9 A+ 2 18.0 48 7 B+ 2 14.0 70 8 A 2 16.0 84 9 A+ 3 27.0 23 10 O 0.5 5.0 21 9 A+ 0.5 4.5 41 9 A+ 1 9.0 45 10 O 1 10.0 63 9 A+ 2 18.0 21 9 A+ 1 9.0 21 9 A+ 1 9.0 44 9 A+ 2 18.0 ... 0 F 2 0.0 23 181.5 0.00000"
    
    # Extract subject totals
    tot_pattern = r'(\d+)\s+(\d+)\s+([A-Z+]+|F)\s+([\d.]+)\s+([\d.]+)'
    matches = re.findall(tot_pattern, tot_line)
    
    print(f"\nFound {len(matches)} subjects:")
    for i, m in enumerate(matches, 1):
        total, gp, grade, credits, cxg = m
        status = "✓ PASS" if grade != 'F' else "✗ FAIL"
        print(f"  Subject {i}: {total} marks, Grade {grade}, Credits {credits} - {status}")
