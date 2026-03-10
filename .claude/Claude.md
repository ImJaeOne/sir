# Coding Principles

1. **Rule of Three** — Don't abstract until you've written it three times
2. **Make it work → Make it right → Make it fast** — Ask yourself which stage this code is at
3. **Start simple** — Never design a perfect system from the start (Gall's Law)
4. **Idempotency** — Same input, same output. Isolate side effects into separate functions
5. **Single Responsibility** — If you need "and" to describe a function, split it
6. **Single Level of Abstraction** — Don't mix levels of detail inside one function

# Commit Convention

format: type(scope): description (#issue-number)
feat(scope): add new feature (#n)
fix(scope): bug fix (#n)
refactor(scope): code improvement without behavior change (#n)
style(scope): UI or style change (#n)
chore: config, package, environment (#n)
docs: documentation (#n)
test(scope): add or update tests (#n)
perf(scope): performance improvement (#n)
ci: CI/CD configuration (#n)
revert: revert previous commit (#n)

# Workflow

- Always stop and wait for confirmation before making a commit
