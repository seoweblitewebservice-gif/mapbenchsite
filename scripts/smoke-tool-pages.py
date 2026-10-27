"""Check every production-rendered English tool page; no remote API calls.
Usage: python scripts/smoke-tool-pages.py [base-url]
"""
import concurrent.futures, html as html_module, json, re, sys, urllib.request
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
slugs = json.load(open('audits/tool-slugs-baseline.json'))
def check(slug):
    with urllib.request.urlopen(BASE + '/tools/' + slug, timeout=60) as r:
        assert r.status == 200, (slug, r.status)
        html = r.read().decode()
    assert len(re.findall(r'<h1(?:\s|>)', html)) == 1, (slug, 'h1 count')
    canonical = re.findall(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
    assert canonical == [f'https://www.mapbench.site/tools/{slug}'], (slug, 'canonical', canonical)
    visible = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
    visible = ' '.join(html_module.unescape(re.sub(r'<[^>]+>', ' ', visible)).split())
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
                assert ' '.join(q['name'].split()) in visible, (slug, 'FAQ question missing')
                assert ' '.join(q['acceptedAnswer']['text'].split()) in visible, (slug, 'FAQ answer missing')
        if s.get('@type') == 'HowTo':
            for step in s['step']:
                assert ' '.join(step['text'].split()) in visible, (slug, 'HowTo step missing')
    return slug
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(check, slugs))
print(f'PASS: {len(results)} tool pages return 200 with one H1, canonical, section anchors, quick answer before workspace and parseable schema.')
