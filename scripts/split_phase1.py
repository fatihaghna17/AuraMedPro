#!/usr/bin/env python3
"""Phase 1: Extract SAMPLE_BANKS, usePomodoro, useAnswerNotes"""

APP_PATH = '/home/z/my-project/AuraMedPro/src/App.tsx'

with open(APP_PATH, 'r') as f:
    lines = f.readlines()

# === 1. Extract SAMPLE_BANKS (lines 68-382, 1-indexed) ===
print(f"Total lines in App.tsx: {len(lines)}")
print(f"Line 68: {lines[67][:60].strip()}")
print(f"Line 382: {lines[381][:60].strip()}")

sample_lines = lines[67:382]
with open('/home/z/my-project/AuraMedPro/src/data/sampleBanks.ts', 'w') as f:
    f.write("import { Question } from '../types';\n\n")
    f.writelines(sample_lines)

print("OK: sampleBanks.ts written")
