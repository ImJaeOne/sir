# Coding Principles

1. **Rule of Three** — Don't abstract until you've written it three times
2. **Make it work → Make it right → Make it fast** — Ask yourself which stage this code is at
3. **Start simple** — Never design a perfect system from the start (Gall's Law)
4. **Idempotency** — Same input, same output. Isolate side effects into separate functions
5. **Single Responsibility** — If you need "and" to describe a function, split it
6. **Single Level of Abstraction** — Don't mix levels of detail inside one function

# Path Alias

Use `@/` for all imports instead of relative paths (e.g. `@/components/Button`)

# React Query 계층 분리

페이지/컴포넌트에 `useQuery`/`useMutation`/`queryClient.invalidateQueries` 직접 사용 금지. 다음 3계층으로 분리:

- `src/lib/api/<domain>Api.ts` — 순수 fetch/supabase 호출. React/react-query 의존성 없음
- `src/hooks/<domain>/<domain>Keys.ts` — queryKey factory (예: `workspaceKeys`, `userKeys`)
- `src/hooks/<domain>/use<Domain>Query.ts`, `use<Domain>Mutation.ts` — `useQuery`/`useMutation` 훅. mutation `onSuccess` 안에서 factory 키로 invalidate
- 페이지/컴포넌트는 훅만 호출

**신규 API 추가 시**: api 함수 → key factory → query/mutation 훅 → 페이지에서 호출 순으로 작성.
**기존 페이지 수정 시**: 인라인된 `useQuery`/`useMutation`/직접 fetch/직접 supabase 호출이 있으면 같은 작업에서 훅 파일로 이관 (이월 금지).

레퍼런스: `src/hooks/workspace/`, `src/hooks/user/`, `src/hooks/blacklist/`.

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
