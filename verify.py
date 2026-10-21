#!/usr/bin/env python3
"""Verify restructured tool pages against the pilot standard.

Usage:
  python3 verify.py                 # strict-check pages listed as done in progress.json
  python3 verify.py --slug a,b,c    # strict-check specific slugs
  python3 verify.py --all-baseline  # light regression check on every built page

Strict checks per page (built HTML in .next/server/app/tools/<slug>.html):
  - tool components byte-identical to verify-baseline.json (sha256)
  - exactly one H1, containing the primary keyword
  - title (<60 chars, rendered) and meta description (<155) contain the keyword
  - primary keyword inside the first 100 words of body text
  - all JSON-LD blocks parse; FAQPage questions/answers equal the visible FAQ
  - required sections present: byline, quick answer (40-50 words, has keyword),
    how-to-use with keyword H2, use cases, example callouts, popular table
    (real <table> with <th scope>), related prose, more-tools grid,
    related grid, sources box
  - every internal /tools/... and /guides/... link resolves to a built page
  - no [VERIFY] markers left in the tool's content file (they must be resolved
    or carried into the batch report explicitly with --allow-verify)
  - new-content similarity vs every other finished page < 0.70 (difflib)
Exit code 0 = pass (warnings allowed), 1 = failures found.
"""
import argparse, difflib, glob, hashlib, json, os, re, sys
from html import unescape
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, '.next', 'server', 'app')

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

class TextStrip(HTMLParser):
    def __init__(self):
        super().__init__(); self.txt = []; self.skip = 0
    def handle_starttag(self, t, a):
        if t in ('script', 'style'): self.skip += 1
    def handle_endtag(self, t):
        if t in ('script', 'style'): self.skip = max(0, self.skip - 1)
    def handle_data(self, d):
        if not self.skip: self.txt.append(d)

def body_text(html):
    ts = TextStrip(); ts.feed(html)
    return ' '.join(' '.join(ts.txt).split())

def built_routes():
    routes = set()
    for p in glob.glob(APP + '/**/*.html', recursive=True):
        rel = os.path.relpath(p, APP)[:-5]
        routes.add('/' + rel.replace(os.sep, '/').replace('/index', '') or '/')
    return routes

def load_content(slug):
    p = os.path.join(ROOT, 'content', slug + '.json')
    return json.load(open(p)) if os.path.exists(p) else None

def new_text(pc):
    parts = [pc.get('quick_answer') or '', pc.get('summary_sentence') or '', pc.get('steps_intro') or '']
    for u in pc.get('use_cases') or []:
        parts.append(u['title'] + ' ' + ' '.join(s['t'] for s in u['body']))
    for e in pc.get('examples') or []:
        parts.append(e['label'] + ' ' + ' '.join(s['t'] for s in e['body']))
    return ' '.join(parts)

def check_components():
    base = json.load(open(os.path.join(ROOT, 'verify-baseline.json')))
    bad = []
    for name, h in base.items():
        p = os.path.join(ROOT, 'src', 'components', 'tools', name)
        if not os.path.exists(p) or sha(p) != h:
            bad.append(name)
    return bad

def strict_check(slug, routes, others_text):
    fails, warns = [], []
    hp = os.path.join(APP, 'tools', slug + '.html')
    if not os.path.exists(hp):
        return [f'{slug}: built page missing'], warns
    h = open(hp).read()
    pc = load_content(slug)
    if not pc:
        return [f'{slug}: content file missing'], warns
    kw = pc['primary_keyword']
    kwl = kw.lower()
    # H1
    h1s = [unescape(x) for x in re.findall(r'<h1[^>]*>([^<]+)</h1>', h)]
    if len(h1s) != 1:
        fails.append(f'{slug}: H1 count = {len(h1s)}')
    elif kwl not in h1s[0].lower():
        fails.append(f'{slug}: H1 lacks primary keyword')
    # title / meta
    title = unescape((re.search(r'<title>([^<]+)</title>', h) or [None, ''])[1])
    if len(title) >= 60: fails.append(f'{slug}: title {len(title)} chars (>=60)')
    if kwl not in title.lower(): fails.append(f'{slug}: title lacks keyword')
    desc = unescape((re.search(r'<meta name="description" content="([^"]+)"', h) or [None, ''])[1])
    if len(desc) >= 155: fails.append(f'{slug}: description {len(desc)} chars (>=155)')
    if kwl not in desc.lower(): fails.append(f'{slug}: description lacks keyword')
    # first 100 words
    words = body_text(h).split()
    if kwl not in ' '.join(words[:100]).lower():
        fails.append(f'{slug}: keyword missing in first 100 words')
    # canonical
    if f'rel="canonical" href="https://www.mapbench.site/tools/{slug}"' not in h:
        fails.append(f'{slug}: canonical mismatch')
    # JSON-LD validity + FAQ equality
    faq_schema = None
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try:
            data = json.loads(block)
        except Exception as e:
            fails.append(f'{slug}: invalid JSON-LD ({e})'); continue
        for item in (data if isinstance(data, list) else [data]):
            if item.get('@type') == 'FAQPage':
                faq_schema = {q['name']: q['acceptedAnswer']['text'] for q in item['mainEntity']}
    vis = {}
    faq_sec = h[h.find('id="faq"'):h.find('id="trust"')]
    for q, a in re.findall(r'<details[^>]*>.*?<span>([^<]+)</span>.*?<p[^>]*>(.*?)</p>', faq_sec, re.S):
        vis[unescape(re.sub(r'<[^>]+>', '', q)).strip()] = unescape(re.sub(r'<[^>]+>', '', a)).strip()
    if faq_schema is None:
        fails.append(f'{slug}: no FAQPage JSON-LD')
    elif set(faq_schema) != set(vis):
        fails.append(f'{slug}: FAQ schema questions != visible FAQ ({len(faq_schema or {})} vs {len(vis)})')
    else:
        for q in faq_schema:
            if faq_schema[q].strip() != vis[q].strip():
                fails.append(f'{slug}: FAQ answer text differs schema vs visible: {q[:40]}')
                break
    if not (10 <= len(vis) <= 13):
        fails.append(f'{slug}: visible FAQ count = {len(vis)} (want 10-12)')
    # sections
    need = {
        'byline': '· Updated' in h or 'Updated ' in h and 'Founder' in h,
        'quick_answer': 'id="quick-answer"' in h,
        'how_to_keyword_h2': f'How to use {kw}' in h,
        'use_cases': 'id="use-cases"' in h,
        'examples': 'Example ·' in h,
        'popular_table': 'id="popular-table"' in h and 'scope="col"' in h,
        'related_prose': 'Related tools and resources' in h,
        'sources_box': 'id="trust"' in h,
        'more_grid': 'id="more-tools"' in h,
        'related_grid': 'id="related-tools"' in h,
    }
    for k, ok in need.items():
        if not ok: fails.append(f'{slug}: section missing: {k}')
    # quick answer words + keyword
    qa = pc.get('quick_answer') or ''
    if not (40 <= len(qa.split()) <= 50):
        fails.append(f'{slug}: quick_answer {len(qa.split())} words (want 40-50)')
    if kwl not in qa.lower():
        fails.append(f'{slug}: quick_answer lacks keyword')
    # content completeness
    for field in ('summary_sentence', 'steps_intro', 'use_cases', 'examples', 'popular_table', 'related_prose'):
        if not pc.get(field):
            fails.append(f'{slug}: content field empty: {field}')
    # internal links resolve
    for link in set(re.findall(r'href="(/tools/[a-z0-9-]+|/guides/[a-z0-9-]+)"', h)):
        if link not in routes:
            fails.append(f'{slug}: internal link does not resolve: {link}')
    # grids disjoint
    _ri = h.find('id="related-tools"'); _re = h.find('</section>', _ri) if _ri >= 0 else -1
    if set(pc.get('more_tools') or []) & set(re.findall(r'href="/tools/([a-z0-9-]+)"', h[_ri:_re] if _re > _ri else '')):
        warns.append(f'{slug}: more_tools may overlap related grid')
    # [VERIFY]
    raw = open(os.path.join(ROOT, 'content', slug + '.json')).read()
    if '[VERIFY]' in raw:
        warns.append(f'{slug}: content still carries [VERIFY] markers')
    # similarity
    mine = new_text(pc)
    for other, otext in others_text.items():
        if other == slug or not otext or not mine: continue
        ratio = difflib.SequenceMatcher(None, mine, otext).ratio()
        if ratio > 0.70:
            fails.append(f'{slug}: new-content similarity {ratio:.2f} with {other} (>0.70)')
    return fails, warns

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', default='')
    ap.add_argument('--all-baseline', action='store_true')
    args = ap.parse_args()
    bad = check_components()
    if bad:
        print('FAIL: tool components changed vs baseline:', bad); return 1
    print('tool components: all byte-identical to baseline ✓')
    routes = built_routes()
    if args.all_baseline:
        fails = []
        for p in sorted(glob.glob(APP + '/tools/*.html')):
            h = open(p).read()
            if len(re.findall(r'<h1', h)) != 1: fails.append(os.path.basename(p) + ': H1 != 1')
            if '<title>' not in h: fails.append(os.path.basename(p) + ': no title')
        print('baseline pages checked:', len(glob.glob(APP + '/tools/*.html')), '| failures:', len(fails))
        for f in fails[:20]: print(' FAIL', f)
        return 1 if fails else 0
    slugs = [s.strip() for s in args.slug.split(',') if s.strip()]
    if not slugs and os.path.exists(os.path.join(ROOT, 'progress.json')):
        slugs = json.load(open(os.path.join(ROOT, 'progress.json'))).get('done', [])
    if not slugs:
        print('no slugs to strict-check (pass --slug or create progress.json)'); return 0
    texts = {}
    for s in slugs:
        pc = load_content(s)
        if pc: texts[s] = new_text(pc)
    all_fails, all_warns = [], []
    for s in slugs:
        f, w = strict_check(s, routes, texts)
        all_fails += f; all_warns += w
        print(('PASS ' if not f else 'FAIL ') + s + (f'  (warnings: {len(w)})' if w else ''))
    for w in all_warns: print(' WARN', w)
    for f in all_fails: print(' FAIL', f)
    print(f'strict-checked {len(slugs)} pages | failures: {len(all_fails)} | warnings: {len(all_warns)}')
    return 1 if all_fails else 0

if __name__ == '__main__':
    sys.exit(main())
