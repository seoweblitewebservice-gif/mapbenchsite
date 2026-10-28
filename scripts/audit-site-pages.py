"""Audit production-rendered English pages after `npm run build`.
Checks local routing and metadata, not external APIs or interactive map behaviour.
"""
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / '.next'
manifest = json.loads((BUILD / 'prerender-manifest.json').read_text())
routing = json.loads((BUILD / 'routes-manifest.json').read_text())
static = set(manifest['routes'])
dynamic = [re.compile(r['regex']) for r in routing['dynamicRoutes']]
redirects = [re.compile(r['regex']) for r in routing['redirects']]
locales = {'es','de','fr','it','pt','nl','pl','ru','sv','da','no','fi','cs','ro','el','hu','tr','uk','ar','ja','ko','zh','hi'}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0
        self.canonical = []
        self.description = []
        self.links = []
        self.ids = set()
        self.title = ''
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self.in_title = True
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name') == 'description': self.description.append(attrs.get('content', ''))
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])
        if attrs.get('id'): self.ids.add(attrs['id'])
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data

def route_exists(path):
    return path in static or path in {'/tools', '/maps'} or (ROOT / 'public' / path.lstrip('/')).is_file() or any(r.match(path) for r in dynamic + redirects)

pages = {}
for route in sorted(static):
    if route.split('/')[1] in locales or route in {'/_not-found', '/_global-error', '/404', '/500'}: continue
    file = BUILD / 'server/app' / ('index.html' if route == '/' else route.lstrip('/') + '.html')
    if not file.is_file(): continue
    raw = file.read_text()
    # Next.js renders framework redirect shells, not public article pages.
    if 'NEXT_REDIRECT;' in raw: continue
    page = Page(); page.feed(raw)
    pages[route] = page
issues = []
links_checked = 0
inbound = Counter()
for route, page in pages.items():
    if page.h1 != 1: issues.append((route, f'H1 count: {page.h1}'))
    if not page.title.strip(): issues.append((route, 'Missing title'))
    if not page.description or not page.description[0].strip(): issues.append((route, 'Missing description'))
    if len(page.canonical) != 1: issues.append((route, f'Canonical count: {len(page.canonical)}'))
    for href in set(page.links):
        url = urlsplit(href)
        if url.scheme and url.scheme not in {'http','https'}: continue
        if url.netloc and url.netloc not in {'mapbench.site','www.mapbench.site'}: continue
        if not url.path.startswith('/') and url.path: continue
        path = (unquote(url.path).rstrip('/') or '/') if url.path else route
        links_checked += 1
        if path != route: inbound[path] += 1
        if not route_exists(path): issues.append((route, f'Unresolved link: {href}'))
        if url.fragment and path in pages and url.fragment not in pages[path].ids:
            issues.append((route, f'Missing fragment: {href}'))
counts = Counter(route.split('/')[1] or 'home' for route in pages)
report = ['# Whole-site rendered-page audit', '', f'Pages checked: **{len(pages)}**. Internal links checked (unique per page): **{links_checked}**. Findings: **{len(issues)}**.', '', '## Coverage', '']
report += [f'- {kind}: {count}' for kind, count in sorted(counts.items())]
report += ['', '## Findings', '', '| Page | Finding |', '| --- | --- |']
report += [f'| {route} | {issue} |' for route, issue in issues] or ['| All checked pages | No findings |']
report += ['', '## Limits', '', 'Checks built HTML for headings, metadata, local link destinations and fragment anchors. Dynamic /tools and /maps are route-validated but not included in this static-page count. Dynamic parameter routes are pattern-validated, not individually requested. This does not test external service availability, geography accuracy, visual parity, or each calculator interaction. No competitor wording or source code is copied.', '']
(ROOT / 'reports').mkdir(exist_ok=True)
(ROOT / 'reports/site-pages-audit.md').write_text('\n'.join(report))
print(f'{len(pages)} pages, {links_checked} internal links, {len(issues)} findings. reports/site-pages-audit.md')
for issue in issues[:30]: print(*issue)
raise SystemExit(bool(issues))
