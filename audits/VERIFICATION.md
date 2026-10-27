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
