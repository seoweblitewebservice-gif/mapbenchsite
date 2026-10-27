# Verification record — 27 October 2026

PR: https://github.com/seoweblitewebservice-gif/mapbenchsite/pull/25
Branch: `arena/1bbff25b-mapbenchsite`
Verified application commit: `39b4b2c9651372e12b402918a94772c3c13ecee3`

## Local production checks

- `npm run build`: PASS.
- `npm run audit:tools`: PASS, all 496 tools.
- `python scripts/smoke-tool-pages.py`: PASS, all 496 local production-rendered pages.
- Targeted ESLint on changed route/component/audit files: PASS.
- Whole-repo lint: FAIL, 66 errors and 12 warnings outside that set; not concealed as a passing check.

## Remote checks

`gh pr checks 25 --watch --interval 15` completed successfully:
- GitHub Actions `build`: PASS (1m9s).
- Vercel: PASS.
- Vercel Preview Comments: PASS.

Vercel API confirms deployment `dpl_8xh1e3dx8WMo7mgpDNQgUcm76PoS` is **READY**, associated with the application commit above, the Arena branch and PR 25. Alias assignment succeeded. This is a preview deployment, not production.

Immutable preview: https://mapbenchsite-4drbsvld8-aryanstyleawesome-7507.vercel.app
Branch preview: https://mapbenchsite-git-arena-1bbff25b-m-12306e-aryanstyleawesome-7507.vercel.app

## Preview access boundary

An unauthenticated fetch of `/tools/map-radius` redirects to Vercel's Protected Deployment login. The project has preview SSO protection. No access control was disabled and no bypass credential was requested or read. Therefore remote deployment readiness/build is verified, but **remote page rendering and interactive behaviour behind SSO are not verified**. An authorized team member should open the preview while signed in to Vercel. Equivalent local production HTML checks passed for every tool; they are not a substitute for remote authenticated interaction checks.

This record is a documentation-only follow-up to the verified application commit. No merge or production deployment was performed.

## Continuation verification — 28 October 2026 (PR 26)

- Branch: `arena/89f029c6-mapbenchsite`.
- Application commit: `a79b63ee84af09904092053cbec1aef476bad9dc`.
- PR: https://github.com/seoweblitewebservice-gif/mapbenchsite/pull/26
- Local production build, TypeScript, strengthened 496-page HTML/schema smoke check, all-tool URL/content/component/link audit and numerical regression tests: PASS.
- Targeted ESLint for the changed TS/TSX/MJS implementation and scripts: PASS.
- Chromium 375px interaction sample: PASS (centroid input/output and no horizontal overflow; CSV ingestion/invalid-row handling; WMM date control; iframe output present). External requests blocked; map tiles and provider responses not verified.
- GitHub Actions run `40565984537`: PASS, including the new all-tool audit and numerical regression steps, then production build.
- Vercel deployment `dpl_RnjPHNtE9JcW62hQRg6KoWk7qYCF`: READY, correct application commit/Arena branch/PR, alias assigned and no alias error. PR Vercel check: PASS.
- Immutable preview: https://mapbenchsite-nj2l480jg-aryanstyleawesome-7507.vercel.app
- Branch preview: https://mapbenchsite-git-arena-89f029c6-m-965168-aryanstyleawesome-7507.vercel.app
- Fetching the deployed centroid page redirects to the Vercel Protected Deployment login. Remote authenticated rendering/interaction is NOT verified. SSO was not disabled and no secrets were accessed.
- Remaining feature boundaries: 18 explicitly limited legacy specialist URLs. Method documentation coverage is 496/496, not a claim of independently proven accuracy across 496 engines.
- No production deploy or merge performed. This verification entry is a documentation-only follow-up to the application commit above.
