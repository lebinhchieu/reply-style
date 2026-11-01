# reply-style

## Tests
Minimize writing and running tests. Write a test only for an acceptance criterion or a real regression risk, one test per risk. Never write test matrices, input sweeps, or tests of trivial code. Prefer extending an existing test file. While building, run only the test files you touched and the ones that reference what you changed. Run the full suite once, on the final commit. Existing tests must keep passing and none may be newly skipped.

## Style
Colours are theme keys only (`success`, `error`, `warning`, `permission`, `planMode`, `ide`, `inactive`, `dimColor`, `bold`), never RGB, never `backgroundColor`. A fill is `inverse` + a theme key, and only on badges and callout labels; inline code is bold + `ide`, no fill. `info` is `planMode`, not `inactive`. Meaning never depends on colour.

## Check
- `claude plugin validate .`
- `claude plugin test .`
