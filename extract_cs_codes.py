import pdfplumber
import re

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    text = page.extract_text()
    if text:
        print("--- RAW TEXT PAGE 1 ---")
        lines = text.split('\n')
        for i, line in enumerate(lines):
            print(f"{i}: {line}")
            
    # Also print Page 2 to see the student data structure
    page2 = pdf.pages[1]
    text2 = page2.extract_text()
    if text2:
        print("\n--- RAW TEXT PAGE 2 ---")
        lines2 = text2.split('\n')
        for i, line in enumerate(lines2[:50]):
            print(f"{i}: {line}")
