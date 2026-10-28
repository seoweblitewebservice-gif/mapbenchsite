# MapBench AdSense readiness audit — 29 October 2026

## Decision

**Readiness: needs work before applying or reapplying; approval probability is not quantifiable.** This is an independent risk assessment, not a Google review or a legal opinion. Google alone decides eligibility. The site has a usable public structure and useful tools, but named operations that are not implemented and repetitive or inaccurate page content are material quality and trust risks. The ad/consent setup also needs owner verification before ad serving. No numeric approval percentage or guarantee is supported by the evidence.

## Scope and evidence

- Inspected the repository, public homepage, live privacy page, live ads.txt and representative live tool pages: GeoJSON Simplify Helper, ZIP Codes by State, County & City, and Nearest Postcode From Your List Finder.
- Ran `npm run verify:site`, `npm run audit:tools`, and `npm run audit:depth` on main-based commit `4bb7db4966fd054673f282165245e344602173e4`. Build generated 973 paths. The rendered-page structural audit checked 888 pages and 48,525 internal links with zero automated findings. All 496 tool pages passed the structural check; 152 lack registry-level implementation-specific method text. The geo test reports 138 core assertions plus focused regressions. Content inventory counted 496 articles (1,390–3,392 words; median 1,730); word count is not a quality or originality measure.
- A simple literal search across 496 generated tool HTML files found the phrase “built for people who need a practical answer” in 215 files, “genuinely complete local workbench” in 68, and “MapForge” in 13. These are signals of shared boilerplate or legacy naming, not a plagiarism test, a count of policy violations, or a full semantic comparison.
- This is an automated site-wide structural review plus targeted manual samples, **not** a full manual factual, legal, copyright, visual or functional review of every page. Dynamic routes are not all independently requested. The tests do not establish provider availability, mobile usability, live ad behavior, Google crawl/index status, traffic quality, or applicant eligibility. Email delivery, dataset licences, consent and ownership/account status were not verified.

## High-priority findings

### 1. Named tools do not all deliver their advertised operation — high

`src/data/toolLimitations.ts` documents 10 workspace limitations. For example the live `/tools/geojson-simplify-helper` explicitly says it displays GeoJSON but cannot simplify it; other entries disclose missing WKT, GARS, British/Irish grid, State Plane, H3, quadkey, GPX speed/pace or multi-segment trail functions. Visible caveats are better than unqualified promises, but a page whose primary named task is unavailable can disappoint users. Google warns that sites should not claim services they do not have: https://support.google.com/adsense/answer/23921?hl=en. Implement the named operation or accurately reposition the page and route without breaking existing links. Review ad placement on nonfunctional screens if ads are added.

### 2. Repeated and unrelated editorial material — high

The live ZIP list page presents state-wide browsing despite offering only city and county modes; its generic population methodology discusses population density and a “MapForge” dataset even though this workspace is a postcode lookup. The live nearest-postcode page says unmatched codes are reported individually, while `ListRadiusTools.tsx` omits unmatched lookups; it also silently limits input to 50. The GeoJSON simplification page simultaneously says simplification is unavailable and includes a broad “complete local workbench” claim. These are concrete sample findings; other pages need individual verification. Literal repeated phrases and legacy “MapForge” references show a broader editorial review is warranted. Remove irrelevant boilerplate, fix claims and test examples against actual implementations. Google asks for unique, relevant material and usable navigation, not simply long articles: https://support.google.com/adsense/answer/7299563?hl=en.

### 3. Privacy / consent and actual tags — high before monetization

`src/app/layout.tsx` loads GA4 directly on every page; no consent manager or consent gating was identified in the inspected shared layout. This is not a conclusion about legal compliance or all possible external configurations. Check real network requests, regional settings and legally required consent with the owner and qualified counsel. Google's current EEA/UK/Switzerland guidance requires a Google-certified TCF-integrated CMP for personalized ads in those regions: https://support.google.com/adsense/answer/13554116?hl=en. Configure and test the appropriate AdSense Privacy & messaging or certified CMP before relevant ads are served; check analytics consent separately.

The privacy page already describes GA4, third-party geographic services, cookies and Google advertising. However, it only describes lightweight preferences in local storage while `ListSpatialTools.tsx` persists form submissions there. Reconcile actual data flows, storage retention, provider requests, disclosures, and any future ad setup; do not claim specific guarantees without verification. Google's publisher policy requires accurate privacy disclosures for Google services: https://support.google.com/adsense/answer/10502938?hl=en.

### 4. AdSense verification and ownership — needs owner action

`https://www.mapbench.site/ads.txt` is publicly readable and lists `pub-7255099559025160`; confirm that this is the actual AdSense account's publisher ID. ads.txt is recommended, not mandatory for approval: https://support.google.com/adsense/answer/12171612?hl=en. No AdSense ad script or verification tag was identified in the inspected repository layout; account-side DNS/verification or other injection mechanisms are unknown. Follow the actual AdSense Sites workflow and verify domain ownership, review status and any policy feedback in the account. Do not insert an invented publisher ID or click your own ads.

### 5. Accuracy and provenance — high

All pages are structurally present, but automated checks cannot establish the accuracy of results, examples, provenance, or source licenses. 152 registry entries lack specific method text. Prior audits document unsupported features and known provider limits. Prioritize popular, high-stakes and external-service-dependent pages; verify sources, maths, export fidelity, links, copyright/licence obligations and on-page limitations. Confirm the actual methodology and dataset vintage on map/study pages before describing them as reviewed. Do not label a complete manual site review based on automated checks.

## Positive findings

- Live homepage loads and organizes the 496 tools by category; public About, Contact, Privacy, Data Sources, Methodology, Editorial Policy and Corrections routes exist in the repository. Email inbox delivery and owner identity are not independently tested.
- Existing interactive tools, explanatory pages and original-looking studies can provide useful value beyond a link directory, subject to individual verification.
- Automated build, structure, local-link and selected calculation checks pass as described above. The public robots and sitemap implementations exist; this does not prove actual Google indexing or crawler access.
- ads.txt is reachable; matching it to the real account remains an owner action.

## Recommended action plan

1. **P0 — named-task gaps:** implement or truthfully reposition the 10 known unsupported workspace operations; verify functions and preserve URLs.
2. **P0 — truthful content:** individually reconcile high-traffic page titles, outputs, steps, examples, FAQs and generic category text; remove unrelated population claims and stale legacy branding. Do not just add more words.
3. **P0 — privacy/consent:** inventory actual data flows and cookies, reconcile the policy with local submissions, and implement/test appropriate Google-certified consent messaging and analytics settings for relevant traffic before ad serving.
4. **P1 — independent quality:** review all remaining tool pages, downloadable-map licences, guides and studies for accuracy and rights. Review 152 missing implementation-specific registry methods; that number is editorial debt, not a Google rejection count.
5. **P1 — real UX:** test representative desktop/mobile views, keyboard navigation, file uploads/downloads, device permissions, failure states and external services. Verify indexed URLs, canonical/redirect behavior and Google crawl access in Search Console.
6. **P1 — account:** in AdSense verify domain/ownership, publisher ID, site review status and Policy Center. Review approved ad placements to avoid obstructing content or accidental clicks: https://support.google.com/adsense/answer/10502938?hl=en.

## Official references

- Eligibility and original content: https://support.google.com/adsense/answer/9724?hl=en
- Site readiness, unique content and navigation: https://support.google.com/adsense/answer/7299563?hl=en
- Common non-approval reasons: https://support.google.com/adsense/answer/81904?hl=en
- Google Publisher Policies: https://support.google.com/adsense/answer/10502938?hl=en
- EEA/UK/Switzerland CMP guidance: https://support.google.com/adsense/answer/13554116?hl=en
- ads.txt guidance: https://support.google.com/adsense/answer/12171612?hl=en
