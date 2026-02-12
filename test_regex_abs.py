import re

lines = [
    "T1 ABS ABS 1 0 F 0.0 ABS ABS ABS ABS ABS",
    "O1 ABS ABS ABS",
    "E1 ABS ABS ABS ABS ABS ABS MARKS",
    "I1 19 P 12 P 15 P 17 P ABS 14 P ... P (78) FAILED" 
]

def test_regex(pattern):
    print(f"\nTesting Pattern: {pattern}")
    for l in lines:
        matches = re.findall(pattern, l)
        print(f"Line: {l[:40]}...")
        print(f"Matches ({len(matches)}): {matches}")

# Current logic (roughly)
print("--- Current Logic ---")
test_regex(r'(\d+)\s+(?:0\s+F|P)')

# New logic
print("\n--- New Logic ---")
# Pattern to capture the VALUE part (Digits or ABS)
# We want to match the whole block to consume it, but capture just the value.
# Group 1: The value (digits or ABS)
# The rest is the suffix (P or 0 F...)
# ABS might not have a suffix in T1/E1 lines.
pattern = r'(?:(\d+)\s+(?:P|0\s+F\s+[\d.]+)|(ABS))'

test_regex(pattern)
