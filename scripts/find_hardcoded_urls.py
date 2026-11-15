import os
import re

src_dir = r"C:\Users\kandu\Desktop\tutortrace\tutortrace\src"
matches = []

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                for idx, line in enumerate(lines):
                    if "localhost:5000" in line or "http://localhost" in line or "127.0.0.1:5000" in line:
                        matches.append((os.path.relpath(p, src_dir), idx + 1, line.strip()))

print(f"Found {len(matches)} occurrences:")
for file, line_num, text in matches:
    print(f"{file}:{line_num} -> {text}")
