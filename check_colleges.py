import pdfplumber
import re

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

colleges = set()

with pdfplumber.open(pdf_path) as pdf:
    for i, page in enumerate(pdf.pages[1:50]): # Check first 50 pages
        text = page.extract_text()
        if text:
            # Look for lines that look like college names
            # Pattern in previous parsed data: "MU-0237: Terna..."
            # Adjust regex to find similar patterns
            lines = text.split('\n')
            for line in lines:
                if "MU-" in line or "College" in line:
                    colleges.add(line.strip())

print(f"Colleges found: {len(colleges)}")
for c in colleges:
    print(c)
