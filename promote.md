# Promote: replydesign

What the PO takes into the project docs when this scope is merged.

- `README.md` "What it draws": the new look. Glyph badges (`✓ ok`, `⚠ warn`, `✗ fail`, `– skip`), callouts `◆ ⚠ › ✓`, vertical diagrams at most 44 columns, no legend. Done in this task.
- Removed from `README.md`: "same look as the squad PO inbox" and "kept in step with the squad po-inbox mod".
- `CLAUDE.md` (task 01): the PO test rule and the colour rule (theme keys only, never `inverse`). Kept as is.
- `hooks/syntax.ts` (task 01): the system-prompt syntax the model reads.
- `project.md` row "UI conventions / design system" is now out of date: the look is no longer a copy of the po-inbox mod. Suggested text: "Design: `ui-design/final.md` of scope replydesign; code in `hooks/draw.tsx`."
- Open, not fixed (outside this scope): `LICENSE` is missing, so the plugin directory check refuses a submission; `plugin.json` has no `author`; `CLAUDE.md` at the plugin root is not loaded by Claude Code as plugin context.
