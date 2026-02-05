import pdfplumber
import json

pdf_path = r"d:\Projects\stats\Bachelor of Engineering( Electronics Engineering)_Term_1_Grade_card.pdf"

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    
    # Analyze pages 2-3 (page 1 might be header/legend)
    for i in [0, 1, 2]:
        page = pdf.pages[i]
        print(f"\n{'='*100}")
        print(f"PAGE {i+1}")
        print(f"{'='*100}")
        
        # Extract text
        text = page.extract_text()
        if text:
            lines = text.split('\n')
            print(f"\n--- RAW TEXT ({len(lines)} lines) ---")
            for idx, line in enumerate(lines):
                print(f"L{idx:03d}: {line}")
        
        # Extract tables
        tables = page.extract_tables()
        print(f"\n--- TABLES FOUND: {len(tables)} ---")
        for j, table in enumerate(tables):
            print(f"\nTable {j+1} ({len(table)} rows x {len(table[0]) if table else 0} cols):")
            for row_idx, row in enumerate(table[:15]):
                print(f"  R{row_idx:02d}: {row}")
