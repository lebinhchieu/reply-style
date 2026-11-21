# reply-style

A Claude Code mod that draws an agent's chat reply with aligned tables, vertical diagrams, state badges and callouts. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header, every second body row on a `bashMessageBackgroundColor` stripe; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. The model draws them vertical, at most 44 columns wide, one step per row joined by `▼`. Connectors are coloured. There is no legend.
- **Badges**: `[ok] [warn] [fail] [skip]` become filled badges ` ✓ ok `, ` ⚠ warn `, ` ✗ fail `, ` – skip ` in a table cell, bullet or sentence. A bullet list with a badge in any item is drawn as one status list. `[decision]`, `[warning]`, `[info]` and `[rec]` in the middle of a line are drawn as small chips (` ✓ rec ` for `[rec]`).
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]` (a list marker such as `- ` in front is fine) gets a filled label chip (` ◆ decision `, ` ⚠ warning `, ` › info `); `[rec]` marks the recommended choice with ` ✓ recommended `.
- **Working notes**: a working note is skippable narration of work in progress: a text block the model writes before a tool call. Output is text the user needs to read or act on: results, findings, numbers, risks, decisions and anything asked of the user. A note is drawn small and quiet (dim, under a middle-dot gutter; no fills, no chips) so you can skip it, and it is never shortened or removed. The engine says which blocks are notes (the model step ended in a tool call), so no tag is needed. A long narration the engine shortens to one sentence is also a note, drawn quiet with a dim ` · summary` mark after its last line; ctrl+o shows the full text. A block while it streams is drawn as output and goes quiet once the tool call starts. The text before `AskUserQuestion` or `ExitPlanMode`, the last text of a turn, any block the mod cannot class, and the last note or summary of a turn you stopped with Esc are drawn as output. When in doubt, a block is output, never a note.

Limits: text from a session you resumed has no step record and is drawn as output. A question written before a tool that raises a permission prompt is drawn as a note; the rule below tells the model to ask in the output instead.

Colours are theme keys (`success`, `error`, `warning`, `permission`, `planMode`, `ide`, `inactive`), never RGB, so the reply follows the user's theme. Output with none of these forms is left to the engine. A working note is always drawn in the quiet style, whether or not it holds a styled part. Text between styled parts is drawn by the engine's own markdown.

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
- Working notes: text you write before a tool call is drawn small and quiet, so the user may skip it. Never put a fact the user needs only there. Your last text in a turn is the output the user reads: repeat every result, finding, number, risk and decision in it. Ask a question or request a decision in that output, not before a tool call.
- Do not nest these inside code fences other than a diagram fence.
```

## Develop

- `claude plugin validate .`
- `claude plugin test .`
