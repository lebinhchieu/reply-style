# reply-style

A Claude Code mod that draws an agent's chat reply with highlighted tables, diagrams, state badges and callouts, the same look as the squad PO inbox. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. Connectors are coloured, `[ok] [warn] [fail] [skip]` tags become chips, and a legend is added.
- **Badges**: `[ok] [warn] [fail] [skip]` in a table cell, bullet or sentence.
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]`; `[rec]` marks the recommended choice.

Colours are theme keys (`success`, `error`, `warning`), never RGB, so the reply follows the user's theme. A reply with none of these is left to the engine. Text between styled parts is drawn by the engine's own markdown.

The plugin also adds a short section to the system prompt so the model knows the syntax (`hooks/syntax.ts`).

## Install

Run `claude --plugin-dir /path/to/reply-style` to try it, or add the folder to a marketplace.

## Develop

- `claude plugin validate .`
- `claude plugin test .`

`hooks/core.ts`, `markup.ts` and `draw.tsx` are copied from the squad po-inbox mod (`hooks/po-inbox/`), trimmed to what a reply needs. Keep the two in step by hand.
