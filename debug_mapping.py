import pdfplumber
import re

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[38] # Page 39
    text = page.extract_text()
    
    # Find student 1311072
    lines = text.split('\n')
    student_lines = []
    capture = False
    for line in lines:
        if '1311072' in line:
            capture = True
        if capture:
            student_lines.append(line)
            if 'TOT' in line and len(student_lines) > 5:
                break
                
    print("Student Data:")
    for l in student_lines:
        print(l)
        
    # Analyze counts
    t1_line = next((l for l in student_lines if l.startswith('T1')), '')
    o1_line = next((l for l in student_lines if l.startswith('O1')), '')
    e1_line = next((l for l in student_lines if l.startswith('E1')), '')
    i1_line = next((l for l in student_lines if l.startswith('I1')), '')
    tot_line = next((l for l in student_lines if l.startswith('TOT')), '')
    
    t1_count = len(re.findall(r'(\d+)\s+P', t1_line))
    o1_count = len(re.findall(r'(\d+)\s+P', o1_line))
    e1_count = len(re.findall(r'(\d+)\s+(?:0\s+F|P)', e1_line))
    i1_count = len(re.findall(r'(\d+)\s+(?:0\s+F|P)', i1_line))
    tot_count = len(re.findall(r'(\d+)\s+(\d+)\s+([A-Z+]+|F)\s+([\d.]+)\s+([\d.]+)', tot_line))
    
    print(f"\nCounts:")
    print(f"T1: {t1_count}")
    print(f"O1: {o1_count}")
    print(f"E1: {e1_count}")
    print(f"I1: {i1_count}")
    print(f"TOT: {tot_count}")
    
    # Check what subjects we have
    print("\nSubject List:")
    subject_codes = ['10411', '10412', '10413', '10414', '10415', '10416', '10417', 
                     '10418', '10419', '10420', '10421', '10422', '10423', '10424']
    for code in subject_codes:
        print(code)
