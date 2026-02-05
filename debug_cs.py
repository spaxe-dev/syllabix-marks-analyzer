import pdfplumber
import re

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

# Search for seat 1141182
with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    
    for page_num, page in enumerate(pdf.pages, 1):
        text = page.extract_text()
        if text and '1141182' in text:
            print(f"\n{'='*80}")
            print(f"FOUND ON PAGE {page_num}")
            print(f"{'='*80}")
            
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if '1141182' in line:
                    # Show context
                    start = max(0, i-2)
                    end = min(len(lines), i+10)
                    for j in range(start, end):
                        marker = ">>>" if '1141182' in lines[j] else "   "
                        print(f"{marker} L{j:02d}: {lines[j]}")
            break
