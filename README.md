# reply-style

A Claude Code mod that draws an agent's chat reply with aligned tables, vertical diagrams, state badges and callouts. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. The model draws them vertical, at most 44 columns wide, one step per row joined by `▼`. Connectors are coloured. There is no legend.
- **Badges**: `[ok] [warn] [fail] [skip]` become filled badges ` ✓ ok `, ` ⚠ warn `, ` ✗ fail `, ` – skip ` in a table cell, bullet or sentence. A bullet list with a badge in any item is drawn as one status list.
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]` gets a filled label chip (` ◆ decision `, ` ⚠ warning `, ` › info `); `[rec]` marks the recommended choice with ` ✓ recommended `.

Colours are theme keys (`success`, `error`, `warning`, `permission`, `planMode`, `ide`, `inactive`), never RGB, so the reply follows the user's theme. A reply with none of these is left to the engine. Text between styled parts is drawn by the engine's own markdown.

The plugin only draws. It does not tell the model which syntax to write: do that in your `CLAUDE.md` (see Set up the rule).

## Install

```
/plugin marketplace add lebinhchieu/reply-style
/plugin install reply-style@reply-style-marketplace
```

To try it locally, run `claude --plugin-dir /path/to/reply-style`.

## Set up the rule

The model must be told the syntax. Some plans (Team, Enterprise) block a plugin from adding to the system prompt, so the rule lives in your own `CLAUDE.md`.

1. Open `~/.claude/CLAUDE.md` (for all projects) or a project's `CLAUDE.md`.
2. Paste the block below.
3. Start a new session. Ask for a comparison; the reply should come back as a table.

```
### Reply styling (reply-style plugin)
The chat draws some markdown in a richer style. This is required in every reply the user reads: when the content fits a form below, you must use that form. Do not judge whether it is worth it. Only text that fits no form is plain prose.
- Use a table for any comparison or list of items with attributes, a diagram for any flow or steps, tags for any status, [decision] for a choice the user must make, [warning] for a risk, [info] for a side note, and [rec] for your recommendation.
- Table: a normal markdown table, about 4 columns, short cells, notes under 25 characters.
- Diagram: a fence labelled `diagram` (optional caption after the word). Draw it vertical: one step per row, at most 44 columns wide, steps joined by `▼` alone on a row. Put the state tag at the end of the step's row. Never draw one wider than 44 columns.
- State tags: [ok] done, [warn] at risk, [fail] failed, [skip] skipped. In a diagram a tag stands alone, with a space or the line edge on both sides.
- State badge: the same four tags in a table cell, bullet or sentence. For a status list, start every bullet with a tag.
- Callout: a line that starts with [decision], [warning] or [info]. One idea per line.
- Recommended choice: a line that starts with [rec].
- One tag per meaning. Never write colour words. Write the state in words too ([fail] Lint: 3 errors), since colour is only a second signal.
- Do not nest these inside code fences other than a diagram fence.
```

## Develop

- `claude plugin validate .`
- `claude plugin test .`
