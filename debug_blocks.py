import pdfplumber
import re
from parse_results import parse_student_block, extract_course_metadata

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Get course metadata
    course_metadata = extract_course_metadata(pdf.pages[0])
    
    page = pdf.pages[38]  # Page 39 (0-indexed)
    text = page.extract_text()
    lines = text.split('\n')
    
    # Build blocks manually for this page
    current_block = []
    blocks = []
    
    for line in lines:
        if re.match(r'^\d{7}\s+[A-Z]', line):
            if current_block:
                blocks.append(current_block)
            current_block = [line]
        elif current_block:
            # Skip header/footer lines
            if not any(skip in line for skip in ['SEAT NO', 'University Of Mumbai', 'PAGE :', '#:', 'ADC:', '%Marks', 'Grade O', 'GRADE POINT', 'NEP 2020']):
                if not line.startswith('10411') and not line.startswith('10412'):
                    current_block.append(line)
    
    if current_block:
        blocks.append(current_block)
    
    print(f"Found {len(blocks)} blocks on page 39")
    
    for i, block in enumerate(blocks):
        print(f"\n--- Block {i+1} ({len(block)} lines) ---")
        for line in block:
            print(f"  {repr(line[:70])}")
        
        student = parse_student_block(block, course_metadata)
        if student:
            print(f"\n  PARSED: {student.seat_no} - {student.name} - {student.total_marks} - {student.result}")
        else:
            print(f"\n  FAILED TO PARSE!")
