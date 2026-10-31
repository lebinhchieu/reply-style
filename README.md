# reply-style

A Claude Code mod that draws an agent's chat reply with aligned tables, vertical diagrams, state badges and callouts. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. The model draws them vertical, at most 44 columns wide, one step per row joined by `▼`. Connectors are coloured. There is no legend.
- **Badges**: `[ok] [warn] [fail] [skip]` become glyph badges `✓ ok`, `⚠ warn`, `✗ fail`, `– skip` in a table cell, bullet or sentence. A bullet list with a badge in any item is drawn as one status list.
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]` is drawn with `◆`, `⚠` or `›`; `[rec]` marks the recommended choice with `✓`.

Colours are theme keys (`success`, `error`, `warning`), never RGB, so the reply follows the user's theme. A reply with none of these is left to the engine. Text between styled parts is drawn by the engine's own markdown.

The plugin also adds a short section to the system prompt so the model knows the syntax (`hooks/syntax.ts`).

## Install

Run `claude --plugin-dir /path/to/reply-style` to try it, or add the folder to a marketplace.

## Develop

- `claude plugin validate .`
- `claude plugin test .`
