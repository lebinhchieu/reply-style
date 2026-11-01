# reply-style

A Claude Code mod that draws an agent's chat reply with aligned tables, vertical diagrams, state badges and callouts. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. The model draws them vertical, at most 44 columns wide, one step per row joined by `▼`. Connectors are coloured. There is no legend.
- **Badges**: `[ok] [warn] [fail] [skip]` become filled badges ` ✓ ok `, ` ⚠ warn `, ` ✗ fail `, ` – skip ` in a table cell, bullet or sentence. A bullet list with a badge in any item is drawn as one status list.
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]` gets a filled label chip (` ◆ decision `, ` ⚠ warning `, ` › info `); `[rec]` marks the recommended choice with ` ✓ recommended `.

Colours are theme keys (`success`, `error`, `warning`, `permission`, `planMode`, `inactive`), never RGB, so the reply follows the user's theme. A reply with none of these is left to the engine. Text between styled parts is drawn by the engine's own markdown.

The plugin also adds a short section to the system prompt so the model knows the syntax (`hooks/syntax.ts`).

## Install

```
/plugin marketplace add lebinhchieu/reply-style
/plugin install reply-style@reply-style-marketplace
```

To try it locally, run `claude --plugin-dir /path/to/reply-style`.

## Develop

- `claude plugin validate .`
- `claude plugin test .`
