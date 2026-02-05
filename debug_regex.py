import pdfplumber
import re

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[38]  # Page 39 (0-indexed)
    text = page.extract_text()
    lines = text.split('\n')
    
    print(f"Page 39 has {len(lines)} lines")
    print("\n--- Looking for 1311072 ---")
    
    for i, line in enumerate(lines):
        if '1311072' in line or '1311071' in line or 'AADIT' in line.upper():
            print(f"\nL{i:03d}: {repr(line)}")
    
    print("\n\n--- Testing regex patterns ---")
    for i, line in enumerate(lines):
        if '1311072' in line:
            print(f"\nTesting line {i}: {line[:80]}...")
            
            # Pattern 1
            match1 = re.match(r'^(\d{7})\s+(.+?)\s+(Regular|Repeater)\s+(MALE|FEMALE)\s+\(([^)]+)\)\s+(.+)$', line)
            print(f"Pattern 1 (with ERN): {match1}")
            
            # Pattern 2
            match2 = re.match(r'^(\d{7})\s+(.+?)\s+(Regular|Repeater)\s+(MALE|FEMALE)\s+(.+)$', line)
            print(f"Pattern 2 (without ERN): {match2}")
            if match2:
                print(f"  Groups: seat={match2.group(1)}, name={match2.group(2)}, status={match2.group(3)}, gender={match2.group(4)}, rest={match2.group(5)[:50]}...")
