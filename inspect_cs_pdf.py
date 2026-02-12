import pdfplumber
import os

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
else:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        
        # Analyze pages 0-2 
        for i in [0, 1, 2]:
            if i < len(pdf.pages):
                page = pdf.pages[i]
                print(f"\n{'='*100}")
                print(f"PAGE {i+1}")
                print(f"{'='*100}")
                
                # Extract text
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    print(f"\n--- RAW TEXT ({len(lines)} lines) ---")
                    for idx, line in enumerate(lines[:30]): # First 30 lines
                        print(f"L{idx:03d}: {line}")
                
                # Extract tables
                tables = page.extract_tables()
                print(f"\n--- TABLES FOUND: {len(tables)} ---")
                for j, table in enumerate(tables):
                    print(f"\nTable {j+1}: First few rows")
                    for row in table[:5]:
                        print(row)
