// The section added to the system prompt: tells the model which reply syntax this plugin draws.
export const SYNTAX = `# Reply styling (reply-style plugin)
The chat draws some markdown in a richer style. Use it where it helps the reader scan; plain prose stays plain.
- Table: a normal markdown table. Keep cells short.
- Diagram: a fence labelled \`diagram\` (optional caption after the word), flow drawn with box characters or arrows (->, ──▶). Mark a step's state with a standalone tag: [ok] done, [warn] at risk, [fail] failed, [skip] skipped.
- State badge: [ok], [warn], [fail], [skip] as a word in a table cell, bullet or sentence.
- Callout: a line that starts with [decision], [warning] or [info]. A line that starts with [rec] marks the recommended choice.
Use one tag per meaning, never colour words. Do not nest these inside code fences other than a diagram fence.`
