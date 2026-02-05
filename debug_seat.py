import pdfplumber
import re

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

# Look for seat number 1311072
with pdfplumber.open(pdf_path) as pdf:
    found = False
    for page_num, page in enumerate(pdf.pages, start=1):
        text = page.extract_text()
        if text and '1311072' in text:
            print(f"\n{'='*80}")
            print(f"FOUND ON PAGE {page_num}")
            print(f"{'='*80}")
            
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if '1311072' in line:
                    print(f"\nContext around seat 1311072:")
                    for j in range(max(0, i-2), min(len(lines), i+8)):
                        marker = ">>>" if j == i else "   "
                        print(f"{marker} L{j:03d}: {lines[j]}")
            found = True
            break
    
    if not found:
        print("Seat 1311072 NOT FOUND in PDF!")
        # Check if there are more students
        all_seats = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                seats = re.findall(r'\b(131\d{4})\b', text)
                all_seats.extend(seats)
        unique_seats = sorted(set(all_seats))
        print(f"\nTotal unique seat numbers found: {len(unique_seats)}")
        print(f"Sample: {unique_seats[:10]}...")
        print(f"Last 10: {unique_seats[-10:]}")
