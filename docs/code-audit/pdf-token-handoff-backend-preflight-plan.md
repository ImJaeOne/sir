# P0 Plan — PDF Token Handoff / Backend Preflight

작성일: 2026-06-25  
상태: 계획 고정. 이 문서는 production/source code를 아직 변경하지 않고, 다음 구현 pass의 범위와 검증 기준을 정의한다.

## Requirements summary

- Based on the previous continuous audit, handle P0 PDF risk first: cross-repo PDF generation currently spans frontend token forwarding, `/report-pdf` middleware bypass, frontend URL-token session setup, backend PDF endpoint, and Playwright rendering.
- Improve security without changing the visible user flow: clicking “보고서 다운로드(PDF)” should still download a PDF for an authorized client user.
- First implementation priority is backend preflight: reject unauthorized or mismatched `workspace_id`/`report_id` before launching Playwright or handing tokens to the render page.
- Second implementation priority is token handoff hygiene: remove access/refresh tokens from normal URL query transport, or at minimum consume/clean/redact them if a temporary fallback remains.
- Do not add new third-party dependencies for this P0 pass.

## Audit basis and file evidence

- Frontend `PdfDownloadButton` forwards Supabase `access_token` and `refresh_token` to backend: `sir-frontend/src/components/client/sidebar/PdfDownloadButton.tsx:53-65`.
- Frontend `PdfDownloadButton` currently logs raw caught error objects: `sir-frontend/src/components/client/sidebar/PdfDownloadButton.tsx:76-78`.
- Frontend PDF render page reads `at`/`rt` query params and calls `supabase.auth.setSession`: `sir-frontend/src/app/report-pdf/[workspaceId]/[reportId]/page.tsx:19-31`.
- Frontend middleware excludes `/report-pdf` from normal auth path: `sir-frontend/src/middleware.ts:13-15` and `sir-frontend/src/lib/supabase/middleware.ts:8-12`.
- Backend PDF endpoint accepts path `workspace_id`/`report_id`, extracts bearer/refresh token, and calls Playwright generation without direct preflight: `sir-backend/main.py:601-621`.
- Backend already has workspace membership helper that can be reused: `sir-backend/main.py:221-224`.
- Backend `require_user` returns verified `user_id` from the Supabase access token: `sir-backend/auth.py:55-71`.
- Backend Playwright service builds a token-bearing URL: `sir-backend/services/pdf_service.py:26-31`.
- Backend Playwright service navigates to that URL and closes the browser after PDF generation: `sir-backend/services/pdf_service.py:42-56`.
- `reports` rows bind `id` to `workspace_id` and expose `status`: `sir-backend/supabase/migrations/sir_schema_1st.sql:384-399`.
- Audit references: frontend `findings.md` F1/F10/F11/F13; backend `findings.md` B2/B9/B13 and `route-auth-matrix.md` §2/§6.

## Acceptance criteria

1. Backend rejects invalid PDF requests **before** launching Playwright when:
   - caller is not authenticated;
   - caller is not a member of `workspace_id`;
   - `report_id` does not exist;
   - `report_id` belongs to a different workspace.
2. The normal Playwright navigation path no longer contains `?at=` or `?rt=` in the URL. If a temporary query fallback remains, the page must consume it once, call `history.replaceState`, and backend/client logs must not include token-bearing URLs.
3. Failure responses preserve intentional status classes:
   - `401`: missing/invalid bearer or missing refresh token;
   - `403`: authenticated user is not a workspace member;
   - `404`: report is missing or does not belong to the workspace;
   - `500`: unexpected generation failure only.
4. Valid client user PDF download still returns an `application/pdf` response.
5. No access token, refresh token, `Authorization` header value, `X-Supabase-Refresh-Token`, `?at=`, or `?rt=` appears in backend logs, frontend console logging, or returned error bodies.
6. Verification uses existing tooling only: Python compile/tests for backend, targeted ESLint/build for frontend if source changes are made.

## Implementation steps

### P0.1 Backend report/workspace preflight first

Expected source/test files for this slice:

- `sir-backend/main.py`
- Optional: `sir-backend/tests/test_pdf_preflight.py` or equivalent stdlib/script-style test
- Optional post-implementation docs: `sir-backend/docs/code-audit/route-auth-matrix.md`, `sir-backend/docs/code-audit/findings.md`

Steps:

1. Change `report_pdf` to accept `user=Depends(require_user)` so the endpoint can use the verified `user_id` returned by `require_user` (`auth.py:55-71`).
2. Add a helper near `_assert_workspace_member`, for example `_assert_report_pdf_access(workspace_id, report_id, user_id)`, that:
   - calls `_assert_workspace_member(workspace_id, user_id)` (`main.py:221-224`);
   - queries `reports` with both `.eq("id", report_id)` and `.eq("workspace_id", workspace_id)`;
   - uses `maybe_single()` and raises `HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다")` for missing/mismatched rows;
   - returns the report row if later status/filename checks need it.
3. Call the helper after bearer/refresh token presence checks and before `generate_report_pdf(...)`.
4. Let `HTTPException` pass through unchanged so `403`/`404` are not collapsed into `500`. Only catch unexpected exceptions around PDF generation.
5. Keep all logging token-free. If a warning is needed, log only `workspace_id`, `report_id`, status class, and exception type.

Rationale:

- This blocks the highest-risk and highest-cost failures before Playwright. It is compatible with the current frontend contract and can be validated without a full browser render.

### P0.2 Token handoff hygiene without new infrastructure

Expected source/test files for this slice:

- `sir-backend/services/pdf_service.py`
- `sir-frontend/src/app/report-pdf/[workspaceId]/[reportId]/page.tsx`
- Optional: `sir-frontend/src/components/client/sidebar/PdfDownloadButton.tsx`
- Optional post-implementation docs: frontend/backend `docs/code-audit/findings.md` or route matrix notes

Preferred approach:

1. Stop interpolating tokens into the URL in `pdf_service.py:26-31` for the normal path.
2. Create a Playwright browser context and use `context.add_init_script` before navigation to expose a temporary PDF session object to the page, then navigate to `/report-pdf/{workspace_id}/{report_id}` without token query params.
3. Update the frontend `/report-pdf` page to read the injected session object, call `supabase.auth.setSession`, and immediately delete the injected value before setting `ready`.
4. Keep `?at=`/`?rt=` only as temporary backward-compatible fallback if needed. If retained, consume once and call `window.history.replaceState(null, '', window.location.pathname)` or equivalent to remove tokens from active history.
5. Add browser cleanup with `try/finally` so `browser.close()` runs even when `goto`, selector wait, or `page.pdf` fails.
6. Avoid page error handlers or exception wrappers that include full URLs or token values.

Fallback if the init-script approach is too risky for one pass:

- Use `URLSearchParams` for token query construction, consume and immediately scrub the query in the page, and add a small redaction helper before any URL-like value is logged. Treat this as temporary and keep P0.2 open.

Rationale:

- Query-string tokens are visible to browser history, diagnostics, and accidental URL logging. Pre-navigation injection keeps tokens out of the URL/referrer path while preserving current user-RLS rendering.

### P0.3 Frontend caller guard and UX-stable failure handling

Expected source/test files for this slice:

- `sir-frontend/src/components/client/sidebar/PdfDownloadButton.tsx`
- Optional later: `sir-frontend/src/lib/api/reportApi.ts` only if a reusable report/workspace validator is introduced

Steps:

1. Keep the existing client-side session requirement before calling backend.
2. Replace `console.error(e)` with sanitized status/error metadata only; do not log token-bearing request objects or raw responses.
3. Keep the same user-facing toast for PDF failure unless product copy is intentionally changed.
4. Later, consider fetching PDF filename metadata with a report query bound to both `workspaceId` and `reportId`; do not block backend preflight on this.

Rationale:

- Backend is the authoritative gate. Frontend changes should reduce accidental sensitive logging while preserving UX.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| FastAPI router dependency already calls `require_user`, and adding `user=Depends(require_user)` may validate twice. | Accept for P0 if simple; later refactor router dependency if needed. The endpoint needs `user_id` for preflight. |
| `HTTPException` could be caught by broad `except Exception` in `report_pdf` and converted to 500. | Split preflight outside the generation `try` or explicitly re-raise `HTTPException`. |
| Playwright init-script token injection may run too early/late relative to client code. | Inject before `page.goto`; page checks both injected object and legacy query fallback during transition. |
| Token object in `window` could remain inspectable after session setup. | Delete it immediately after `setSession` resolves/rejects and avoid persisting outside Supabase auth storage. |
| Browser process may remain open after selector timeout. | Wrap browser/context/page lifecycle in `try/finally`. |
| No hermetic cross-repo e2e harness exists. | Add helper-level backend tests and run manual smoke checklist for browser/PDF behavior. |

## Verification steps

Backend:

1. Static syntax/import check:
   - `cd sir-backend && python3 -m py_compile main.py services/pdf_service.py`
2. Helper-level tests without live Playwright where possible:
   - valid member + matching report passes;
   - non-member workspace raises 403;
   - member + mismatched report/workspace raises 404;
   - missing report raises 404;
   - missing refresh token still raises 401 before generation.
3. If a script-style test is used, make it explicitly non-destructive and avoid live DB writes unless guarded.

Frontend:

1. Targeted lint if source changes are made:
   - `cd sir-frontend && npx eslint 'src/app/report-pdf/[workspaceId]/[reportId]/page.tsx' 'src/components/client/sidebar/PdfDownloadButton.tsx'`
2. Build if source changes are made:
   - `cd sir-frontend && npm run build`

Cross-repo manual smoke after implementation:

1. Valid client user downloads a PDF from a matching workspace/report.
2. Same user manually requests a mismatched `{workspaceId}/{reportId}` pair and backend returns 404 before Playwright render.
3. Non-member user receives 403.
4. Missing/expired access token receives 401.
5. Backend logs contain no `?at=`, `?rt=`, `Authorization`, `X-Supabase-Refresh-Token`, `refresh_token`, or raw token substrings.

## Non-goals for this P0 pass

- Do not redesign the entire PDF rendering architecture around a database-backed one-time render token unless P0.2 cannot be made safe enough.
- Do not broaden admin/client route policy changes; keep that as a separate finding.
- Do not regenerate Supabase generated types as part of this PDF fix unless a code change directly requires it.
- Do not introduce a new test framework dependency without explicit approval.

## Stop condition for the implementation pass

Stop and report as complete when:

- backend preflight is implemented and verified;
- token-bearing URL is removed from normal Playwright navigation or explicitly documented as a temporary fallback with cleanup/redaction;
- targeted checks pass or any validation gap is concrete and reproducible;
- audit docs are updated with implemented behavior and remaining risks.
