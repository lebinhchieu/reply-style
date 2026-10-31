// The section added to the system prompt: tells the model which reply syntax this plugin draws.
export const SYNTAX = `# Reply styling (reply-style plugin)
The chat draws some markdown in a richer style. Use it where it helps the reader scan; plain prose stays plain.
- Table: a normal markdown table, about 4 columns, short cells, notes under 25 characters.
- Diagram: a fence labelled \`diagram\` (optional caption after the word). Draw it vertical: one step per row, at most 44 columns wide, steps joined by \`▼\` alone on a row. Put the state tag at the end of the step's row. Never draw one wider than 44 columns.
- State tags: [ok] done, [warn] at risk, [fail] failed, [skip] skipped. In a diagram a tag stands alone, with a space or the line edge on both sides.
- State badge: the same four tags in a table cell, bullet or sentence. For a status list, start every bullet with a tag.
- Callout: a line that starts with [decision], [warning] or [info]. One idea per line.
- Recommended choice: a line that starts with [rec].
- One tag per meaning. Never write colour words. Write the state in words too ([fail] Lint: 3 errors), since colour is only a second signal.
- Do not nest these inside code fences other than a diagram fence.`
