# Project source map

**Where each kind of truth lives in this project. Roles read this instead of guessing paths.** Filled in by `/squad:squad-init`; the Manager keeps it current.

| What | Where |
|---|---|
| Project instructions | `CLAUDE.md` at the repo root (Tests, Style, Check). Team-level rules go there, through a PO-merged task. |
| Requirements | `README.md` ("What it draws", "Set up the rule", "Install"). New work comes as the PO's scope or goal brief. |
| Business AC | `README.md` "What it draws" (tables, diagrams, badges, callouts). Per-scope AC live in the scope's brief. |
| Technical AC / done rules | `CLAUDE.md` "Check" and "Style": `claude plugin validate .` and `claude plugin test .` both pass; colours are theme keys only, never RGB; fills only on badges, callout labels and the table row stripe; meaning never depends on colour. Output with none of these forms is left to the engine; a working note is always drawn in the quiet style, whether or not it holds a styled part. Existing tests keep passing, none newly skipped. |
| Decisions | No decisions file. Lasting decisions go into `README.md` (behaviour) or `CLAUDE.md` (team rules), through a PO-merged task. Create `docs/decisions.md` only if the PO asks. |
| Open questions for outside people | None. There are no outside decision makers; open questions go to the PO through the Manager. |
| Tasks / tickets | `$SCOPE_DIR/tasks/` |
| Evidence | next to the ticket: <ticket path minus .md>/ (reviewers' working files and receipts: $SCOPE_DIR/evidence/) |
| Code repos | `/home/chieule/workspace/reply-style` (one repo, no submodules). Source: `hooks/` (`core.ts`, `markup.ts`, `draw.tsx`, `segments.ts`, `register.tsx`, `hooks.json`). Manifests: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`. Types: `.claude-plugin/types/` (git-ignored). |
| Test and lint commands | `claude plugin validate .` and `claude plugin test .` (from `CLAUDE.md` "Check"). No package.json, no separate lint command. Unit tests sit next to the code: `hooks/*.test.ts(x)`. |
| UI conventions / design system | `CLAUDE.md` "Style" (theme keys, fills, `info` = `planMode`). Code: `hooks/draw.tsx`, `hooks/core.ts`. The old design note `.claude/squads/plugin_bk261121/scopes/_done/replydesign/ui-design/final.md` is local-only history. |
| Running app | No server or login. QA blackbox runs `claude --plugin-dir <worktree>` in a terminal and checks how a reply is drawn (tables, diagrams, badges, callouts, narrow terminal). |
| Release | Version in `.claude-plugin/plugin.json`, bumped in its own commit (e.g. `0.1.7`). |

## Outside decision makers
- None. Chieu decides. Questions go to Chieu through the Manager.
