import pdfplumber

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Page 7 based on previous output
    page = pdf.pages[6] 
    text = page.extract_text()
    
    if '1141100' in text:
        with open('deepraj_safe.txt', 'w', encoding='utf-8') as f:
            f.write("FOUND ON PAGE 7\n")
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if '1141100' in line:
                    for j in range(max(0, i-2), min(len(lines), i+10)):
                        # Replace non-ascii
                        safe = line = lines[j].encode('ascii', 'replace').decode()
                        f.write(f"L{j}: {safe}\n")
                    break
