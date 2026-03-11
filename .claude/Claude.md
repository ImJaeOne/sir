# Coding Principles

1. **Rule of Three** — Don't abstract until you've written it three times
2. **Make it work → Make it right → Make it fast** — Ask yourself which stage this code is at
3. **Start simple** — Never design a perfect system from the start (Gall's Law)
4. **Idempotency** — Same input, same output. Isolate side effects into separate functions
5. **Single Responsibility** — If you need "and" to describe a function, split it
6. **Single Level of Abstraction** — Don't mix levels of detail inside one function

# Path Alias

Use `@/` for all imports instead of relative paths (e.g. `@/components/Button`)

# Commit Convention

format: `type(scope): description (#issue-number)`

| Type     | When to use                              |
| -------- | ---------------------------------------- |
| feat     | new feature                              |
| fix      | bug fix                                  |
| refactor | code improvement without behavior change |
| style    | UI or style change                       |
| chore    | config, package, environment             |
| docs     | documentation                            |
| test     | add or update tests                      |
| perf     | performance improvement                  |
| ci       | CI/CD configuration                      |
| revert   | revert previous commit                   |

# Workflow

## Commit Flow

When work is ready to commit, follow these steps and STOP before executing the commit:

**Step 1 — Stage files**

```bash
git add <files>
```

**Step 2 — Show staged diff**

```bash
git diff --staged
```

**Step 3 — Propose commit message**
Present the commit message in this format and wait for confirmation:

```
type(scope): description (#issue-number)
```

⛔ Do NOT run `git commit` until the user explicitly confirms the message.

## Context Management

- If context feels lost or circular, compact the current state into a summary doc and start a new chat
- Follow RPI: Research → Plan → Implement
