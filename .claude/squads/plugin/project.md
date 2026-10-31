# Project source map

**Where each kind of truth lives in this project. Roles read this instead of guessing paths.** Filled in by `/squad:squad-init`; the Manager keeps it current.

| What | Where |
|---|---|
| Project instructions | `CLAUDE.md` at the repo root (created by replydesign task 01, PO-merged; it holds the PO's test rule). Until it is merged, scope.md "Notes from the PO" carries the rule. Team-level rules go there, through a PO-merged task. |
| Requirements | `README.md` ("What it draws", "Install"). New work comes as the PO's scope or goal brief. |
| Business AC | `README.md` "What it draws" (tables, diagrams, badges, callouts). Per-scope AC live in the scope's brief. |
| Technical AC / done rules | `claude plugin validate .` and `claude plugin test .` both pass. Colours are theme keys (`success`, `error`, `warning`), never RGB. A reply with no styled part is left to the engine. |
| Decisions | No decisions file yet. Lasting decisions go into `README.md`. Create `docs/decisions.md` if the PO asks. |
| Open questions for outside people | None. There are no outside decision makers; open questions go to the PO. |
| Tasks / tickets | `$SCOPE_DIR/tasks/` |
| Evidence | next to the ticket: <ticket path minus .md>/ (reviewers' working files and receipts: $SCOPE_DIR/evidence/) |
| Code repos | `/home/chieule/workspace/reply-style` (one repo, no submodules). Source: `hooks/` (`core.ts`, `markup.ts`, `draw.tsx`, `segments.ts`, `register.tsx`, `syntax.ts`). Manifest: `.claude-plugin/plugin.json`. Types: `.claude-plugin/types/`. |
| Test and lint commands | `claude plugin validate .` and `claude plugin test .` (from the README "Develop" section). No package.json, no separate lint command. Unit tests sit next to the code: `hooks/*.test.ts(x)`. |
| UI conventions / design system | Design: `.claude/squads/plugin/scopes/replydesign/ui-design/final.md` (look A, vertical diagrams, glyph badges). Code: `hooks/draw.tsx`, `core.ts`. No longer kept in step with the squad po-inbox mod. |
| Running app | No server or login. QA blackbox runs `claude --plugin-dir <worktree>` in a terminal and checks how a reply is drawn (tables, diagrams, badges, callouts, narrow terminal). |

## Outside decision makers
- None. The PO decides. Questions go to the PO through the Manager.
