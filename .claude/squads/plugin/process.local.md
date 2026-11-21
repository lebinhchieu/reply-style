# Local process

## add SQ-1 Check fresh every 10 turns
roles: ba, team-lead, tech-lead, qa-whitebox, qa-blackbox, designer, architect
aware: dev
topic: cost
why: worknotes it.1 coach P1; metric ctx at fresh minus line, baseline dev-1 +53k, qab +45k, target under +15k
upstream: proposed
Every role runs `squad-usage --check` at each handoff and at least every 10 turns, and acts on `fresh` at once; never wait for the hook.

## add SQ-2 Check the sha before a verdict
roles: qa-whitebox, qa-blackbox
topic: review
why: worknotes it.1 coach P2; metric PASS verdicts re-done on another sha, baseline 1
upstream: proposed
Before testing, a QA runs `git rev-parse HEAD` in the tree it tests and compares it with the handed-in sha. Every `PASS` or `FAIL` names that sha. On a different sha the QA sends `BLOCKED` to the Team Lead and never tests.

## add SQ-3 No shared file in parallel tickets
roles: team-lead
topic: developers
why: worknotes it.1 coach P3; metric merge rebuilds from a shared file, baseline 1
upstream: proposed
Before the Team Lead assigns two tickets at once, it compares their `Files:` lines. Tickets that share a file run one after the other, on one branch or with the later one based on the earlier one's sha.
