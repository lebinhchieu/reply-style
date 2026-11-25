# reply-style

A Claude Code mod that draws an agent's chat reply with aligned tables, vertical diagrams, state badges and callouts. It works in any project and does not need squad.

## What it draws

- **Tables**: aligned columns with a rule under the header, every second body row on a `bashMessageBackgroundColor` stripe; stacked `column: value` rows when the terminal is narrow.
- **Diagrams**: a fence labelled `diagram`, or any fence with box-drawing characters. The model draws them vertical, at most 44 columns wide, one step per row joined by `▼`. Connectors are coloured. There is no legend.
- **Badges**: `[ok] [warn] [fail] [skip]` become filled badges ` ✓ ok `, ` ⚠ warn `, ` ✗ fail `, ` – skip ` in a table cell, bullet or sentence. A bullet list with a badge in any item is drawn as one status list. `[decision]`, `[warning]`, `[info]` and `[rec]` in the middle of a line are drawn as small chips (` ✓ rec ` for `[rec]`).
- **Callouts**: a line starting `[decision]`, `[warning]` or `[info]` (a list marker such as `- ` in front is fine) gets a filled label chip (` ◆ decision `, ` ⚠ warning `, ` › info `); `[rec]` marks the recommended choice with ` ✓ recommended `.
- **Sections**: every section of a reply starts with a tag the model writes. `[working]` marks a section you may skip (a fact in it that you need is repeated in the closing summary); `[summary]` marks the one closing section you must read, written when a piece of work ends or when you must act. A turn that only waits for agents, subagents or background tasks has no summary, just one `[working]` line that names the wait. A line starting with the tag, the tag alone on its own line, or a heading starting with it (`## [summary] Result`) gets a filled chip (` ○ working `, ` ● summary `). A summary tag carries its count since your last prompt, `[summary 2]`, drawn ` ● summary 2 `; the section runs to the next tag or the end of the block. The body is drawn as normal text. Mid-line, the tag is a small chip. Text with no tag is drawn as plain output. The engine's own one-sentence summary of a long narration is left to the engine.

Colours are theme keys (`success`, `error`, `warning`, `permission`, `planMode`, `ide`, `inactive`), never RGB, so the reply follows the user's theme. Output with none of these forms is left to the engine. Text between styled parts is drawn by the engine's own markdown.

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
- Sections: start every section with [working] or [summary], whatever the reply's length (the tag alone on a line, at the start of a line, or at the start of a heading). Text before a tool call is [working], except before AskUserQuestion and ExitPlanMode. Everything the user must know (results, findings, numbers, risks, decisions, questions) goes in [summary]; anything you repeat in the summary, or that the user may skip, is [working]. Number every [summary]: find your last [summary N]. If a message the user typed came after it, write [summary 1]; otherwise write [summary N+1]. Only a message the user typed resets the count. These are not typed by the user and never reset it: a cross-session or SendMessage message, a subagent hand-back, a task notification, an idle notice, a wake-up, a hook message or a command output. Write a [summary] only when a piece of work ends or the user must act: the turn that finishes the work, the text before AskUserQuestion or ExitPlanMode, or a question or blocker only the user can settle (an inbox item too). It is then the only [summary] of the reply, it comes last, and it repeats every fact the user must know from the whole piece of work, including facts from earlier turns that only waited. A turn that stops only to wait for agents, subagents, background tasks or a wake-up, while any of them still runs, has no [summary]: write one [working] line that names what you wait for, and keep new facts for the closing [summary], unless the user must act now. Facts the user has not yet seen in a [summary], also from an interrupted turn, go into the next one. If unsure whether the work is done, write the [summary].
- Do not nest these inside code fences other than a diagram fence.
```

## Develop

- `claude plugin validate .`
- `claude plugin test .`
