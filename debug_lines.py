import pdfplumber
import re

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[38]  # Page 39 (0-indexed)
    text = page.extract_text()
    lines = text.split('\n')
    
    print("Lines containing potential student records (7-digit number at start):")
    for i, line in enumerate(lines):
        if re.match(r'^\d{7}\s+[A-Z]', line):
            print(f"  L{i}: {line[:70]}...")
    
    print("\n\nAll lines on page 39:")
    for i, line in enumerate(lines):
        print(f"L{i:02d}: {repr(line)[:100]}")
