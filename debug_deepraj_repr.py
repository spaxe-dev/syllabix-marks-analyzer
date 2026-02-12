import pdfplumber

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Page 7 based on previous output
    page = pdf.pages[6] 
    text = page.extract_text()
    
    if '1141100' in text:
        print("FOUND ON PAGE 7")
        # Print raw repr to see newlines
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if '1141100' in line:
                # Show surrounding lines with repr
                for j in range(max(0, i-2), min(len(lines), i+10)):
                    print(f"L{j}: {repr(lines[j])}")
                break
