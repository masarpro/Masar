import { readFileSync, writeFileSync } from 'fs';

// Read the error list
const errors = readFileSync('D:/Masar/Masar/ts_errors.txt', 'utf8').trim().split('\n');

// Parse errors into structured data: { file, line, col, type, paramName }
const parsed = errors.map(line => {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (?:Parameter|Binding element) '(\w+)' implicitly has an 'any' type\./);
  if (!match) return null;
  return {
    file: match[1],
    line: parseInt(match[2]),
    col: parseInt(match[3]),
    type: match[4],
    paramName: match[5],
  };
}).filter(Boolean);

// Group by file
const byFile = {};
for (const err of parsed) {
  if (!byFile[err.file]) byFile[err.file] = [];
  byFile[err.file].push(err);
}

console.log(`Total errors: ${parsed.length}`);
console.log(`Total files: ${Object.keys(byFile).length}`);

let totalFixed = 0;
let totalSkipped = 0;
const failedFiles = [];

for (const [file, fileErrors] of Object.entries(byFile)) {
  try {
    let content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Sort errors by line DESC, col DESC so we can modify from end to start
    // without affecting earlier positions
    const sortedErrors = [...fileErrors].sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.col - a.col;
    });

    let fixCount = 0;

    for (const err of sortedErrors) {
      const lineIdx = err.line - 1; // 0-based
      if (lineIdx < 0 || lineIdx >= lines.length) continue;

      const lineContent = lines[lineIdx];
      const colIdx = err.col - 1; // 0-based

      // Find the parameter name at the position
      const paramName = err.paramName;

      // Check if parameter is at the expected position
      const atPos = lineContent.substring(colIdx);

      if (!atPos.startsWith(paramName)) {
        // Try to find it nearby
        totalSkipped++;
        continue;
      }

      // Check if it already has a type annotation
      const afterParam = lineContent.substring(colIdx + paramName.length);

      if (afterParam.match(/^\s*:/)) {
        // Already has type annotation
        totalSkipped++;
        continue;
      }

      // For binding elements (TS7031) like `{ field }` we need special handling
      if (err.type === 'TS7031') {
        // This is a destructured binding element.
        // We need to find the closing } and add : any after }
        // e.g., ({ field }) => ... should become ({ field }: any) => ...
        // But actually TS7031 points to the binding element itself
        // The pattern is usually: ({ field }) => or ({ field, other }) =>
        // We need to find the enclosing { } and add : any to the whole destructuring

        // Look backwards from colIdx to find the opening {
        let braceStart = -1;
        for (let i = colIdx; i >= 0; i--) {
          if (lineContent[i] === '{') {
            braceStart = i;
            break;
          }
        }

        if (braceStart === -1) {
          totalSkipped++;
          continue;
        }

        // Find matching closing brace
        let depth = 0;
        let braceEnd = -1;
        for (let i = braceStart; i < lineContent.length; i++) {
          if (lineContent[i] === '{') depth++;
          if (lineContent[i] === '}') {
            depth--;
            if (depth === 0) {
              braceEnd = i;
              break;
            }
          }
        }

        if (braceEnd === -1) {
          totalSkipped++;
          continue;
        }

        // Check if already annotated
        const afterBrace = lineContent.substring(braceEnd + 1);
        if (afterBrace.match(/^\s*:/)) {
          totalSkipped++;
          continue;
        }

        // Check if this destructuring is already handled (another error on same line may have fixed it)
        // Add `: any` after the closing brace
        lines[lineIdx] = lineContent.substring(0, braceEnd + 1) + ': any' + lineContent.substring(braceEnd + 1);
        fixCount++;
      } else {
        // TS7006 - regular parameter
        // Add `: any` after the parameter name
        lines[lineIdx] = lineContent.substring(0, colIdx + paramName.length) + ': any' + lineContent.substring(colIdx + paramName.length);
        fixCount++;
      }
    }

    if (fixCount > 0) {
      writeFileSync(file, lines.join('\n'), 'utf8');
      totalFixed += fixCount;
      console.log(`Fixed ${fixCount} in ${file}`);
    }
  } catch (e) {
    failedFiles.push({ file, error: e.message });
  }
}

console.log(`\nTotal fixed: ${totalFixed}`);
console.log(`Total skipped: ${totalSkipped}`);
if (failedFiles.length > 0) {
  console.log(`Failed files:`, failedFiles);
}
