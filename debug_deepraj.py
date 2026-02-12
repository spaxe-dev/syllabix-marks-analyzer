import pdfplumber
import re

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text and '1141100' in text:
            print("FOUND ON PAGE", page.page_number)
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if '1141100' in line:
                    # Print context blocks
                    start = i
                    end = min(len(lines), i + 20)
                    for j in range(start, end):
                        print(f"L{j}: {lines[j]}")
                    break
