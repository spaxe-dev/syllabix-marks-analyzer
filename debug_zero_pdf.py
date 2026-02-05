import pdfplumber
import re

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

# Students with 0 marks - search for them in the PDF
zero_mark_seats = ['1311008', '1311009', '1311020', '1311021', '1311036', '1311037', '1311063']

with pdfplumber.open(pdf_path) as pdf:
    for seat in zero_mark_seats[:2]:  # Just check first 2
        print(f"\n{'='*80}")
        print(f"SEARCHING FOR SEAT {seat}")
        print(f"{'='*80}")
        
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text and seat in text:
                print(f"\nFound on page {page_num}:")
                lines = text.split('\n')
                for i, line in enumerate(lines):
                    if seat in line:
                        # Show context
                        start = max(0, i-1)
                        end = min(len(lines), i+8)
                        for j in range(start, end):
                            marker = ">>>" if j == i else "   "
                            print(f"{marker} L{j:02d}: {lines[j]}")
                break
