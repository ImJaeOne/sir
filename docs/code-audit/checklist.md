# sir-frontend Code Audit Checklist

> 목적: SIR frontend 구조, 데이터 흐름, 보안/취약점, 유지보수 개선점을 근거 파일과 함께 누적한다.
> 규칙: 체크 완료 항목은 근거 파일/라인 또는 요약 파일을 함께 남긴다.

## 0. Repository baseline
- [x] package/scripts/dependency map — see `structure.md` §1
- [x] framework/build/runtime config map — see `structure.md` §1
- [x] source tree top-level map — see `structure.md` §2
- [x] route/app structure map — see `structure.md` §2, §4

## 1. Architecture and data flow
- [x] app router / page layout boundaries — see `structure.md` §4
- [x] API client layer (`src/lib/api`) inventory — see `route-api-matrix.md` §2
- [x] React Query hooks inventory — see `route-api-matrix.md` §3
- [x] auth/session/profile/workspace flow — see `structure.md` §4
- [x] state stores and client caches — see `structure.md` §5
- [x] type model boundaries and generated types — see `structure.md` §7 and `findings.md` F6

## 2. Security and vulnerability review
- [x] env var exposure and client/server boundary — see `findings.md` F2/F4
- [x] auth guard / route protection review — see `route-api-matrix.md` §1
- [x] Supabase client usage and RLS assumptions — service-role/API matrix + client report/monitoring/crisis trace done; DB policy review pending, see `route-api-matrix.md` §1 and `structure.md` §11
- [ ] unsafe DOM/rendering/file/url handling
- [x] data leakage across workspaces/users — client report/PDF route-param and backend handoff trace done; see `structure.md` §11-12 and `findings.md` F10/F11
- [x] dependency/config risk notes — see `structure.md` §10 and `findings.md` F9

## 3. Reliability and performance
- [ ] loading/error/empty state consistency
- [x] query invalidation/cache freshness patterns — see `structure.md` §8
- [ ] large list/table/virtualization patterns
- [x] build/lint warning inventory — see `structure.md` §10 and `findings.md` F8
- [ ] dead/commented code inventory

## 4. UX/product consistency
- [ ] navigation/sidebar/report flow
- [ ] monitoring/insights/crisis flow
- [x] admin/client role surface separation — see `structure.md` §12 and `findings.md` F3/F12
- [ ] mobile/responsive coverage hotspots

## 5. Tests and verification surface
- [x] existing test inventory — see `structure.md` §9 and `findings.md` F7
- [x] missing high-value regression tests — see `structure.md` §9 and `findings.md` backlog
- [x] smoke/e2e candidates — see `structure.md` §9 and `findings.md` backlog

## 6. Findings backlog
- [x] rank findings by severity/confidence — see `findings.md`
- [x] rank improvement opportunities by impact/effort — see `findings.md` backlog
- [x] define next read-only probes — see `structure.md` §6 and `findings.md`
