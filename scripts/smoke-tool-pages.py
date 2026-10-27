"""Check every production-rendered English tool page; no remote API calls.
Usage: python scripts/smoke-tool-pages.py [base-url]
"""
import concurrent.futures, json, re, sys, urllib.request
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
slugs = json.load(open('audits/tool-slugs-baseline.json'))
def check(slug):
    with urllib.request.urlopen(BASE + '/tools/' + slug, timeout=60) as r:
        assert r.status == 200, (slug, r.status)
        html = r.read().decode()
    assert len(re.findall(r'<h1(?:\s|>)', html)) == 1, (slug, 'h1 count')
    assert f'https://www.mapbench.site/tools/{slug}' in html, (slug, 'canonical')
    for anchor in ['quick-answer', 'how-to-use', 'method-and-limits', 'faq', 'related-tools']:
        assert f'id="{anchor}"' in html, (slug, 'missing anchor', anchor)
    assert html.index('id="quick-answer"') < html.index('Tool workspace'), (slug, 'answer below workspace')
    schemas = []
    for text in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html):
        obj = json.loads(text)
        schemas.extend(obj if isinstance(obj, list) else [obj])
    for kind in ['WebApplication', 'FAQPage', 'BreadcrumbList']:
        assert any(s.get('@type') == kind for s in schemas), (slug, kind)
    for s in schemas:
        if s.get('@type') == 'FAQPage':
            for q in s['mainEntity']:
                # Escaping differs in HTML; the question should appear in visible markup.
                import html as h
                assert h.escape(q['name'], quote=False).replace("'", '&#x27;') in html or h.escape(q['name']) in html or q['name'] in html, (slug, q['name'])
    return slug
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(check, slugs))
print(f'PASS: {len(results)} tool pages return 200 with one H1, canonical, section anchors, quick answer before workspace and parseable schema.')
