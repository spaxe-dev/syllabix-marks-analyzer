import pdfplumber

pdf_path = r"d:\Projects\stats\1211461 Bachelor of Engineering( Computer Science and Engineering) ( Semester - I) ( NEP 2020 ).pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Try different extraction strategies
    print("--- SIMPLE ---")
    print(pdf.pages[0].extract_text()[:500])
    
    print("\n--- LAYOUT ---")
    print(pdf.pages[0].extract_text(layout=True)[:500])
    
    print("\n--- WORDS ---")
    words = pdf.pages[0].extract_words()
    # Print first 20 words
    for w in words[:20]:
        print(w['text'])
