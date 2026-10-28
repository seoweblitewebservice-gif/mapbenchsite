"""Count rendered tool editorial text, excluding global navigation and calculators.
Run after a production build. Counts are inventory, not competitor-parity scores.
"""
import csv, json, re, statistics
from html.parser import HTMLParser
from pathlib import Path

class Editorial(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.text = []
        self.headings = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div' and 'editorial-body' in attrs.get('class', '').split(): self.depth = 1
        elif self.depth and tag == 'div': self.depth += 1
        if self.depth and tag in ('h2', 'h3'): self.headings += 1
    def handle_endtag(self, tag):
        if self.depth and tag == 'div': self.depth -= 1
    def handle_data(self, text):
        if self.depth: self.text.append(text)

rows = []
for path in Path('.next/server/app/tools').glob('*.html'):
    parser = Editorial(); parser.feed(path.read_text())
    if not parser.text: raise SystemExit(f'No editorial body: {path}')
    words = len(re.findall(r"\b[\w]+(?:[-’'][\w]+)*\b", ' '.join(parser.text)))
    content = json.loads(Path(f'content/{path.stem}.json').read_text())
    rows.append({'slug': path.stem, 'editorial_words': words, 'headings': parser.headings,
                 'page_specific_uses': len(content.get('use_cases') or []),
                 'page_specific_examples': len(content.get('examples') or []),
                 'competitor_word_parity': 'Not measured',
                 'note': 'Dedicated article' if path.stem == 'distance-matrix-calculator' else ''})
rows.sort(key=lambda row: (row['editorial_words'], row['slug']))
assert len(rows) == 496, 'Expected complete canonical tool inventory'
Path('reports').mkdir(exist_ok=True)
with open('reports/tool-content-depth.csv', 'w') as file:
    writer = csv.DictWriter(file, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
summary = f'''# Tool content-depth inventory

All {len(rows)} rendered tool articles counted. Range: {rows[0]['editorial_words']}–{max(row['editorial_words'] for row in rows)} words. Median: {statistics.median(row['editorial_words'] for row in rows):.0f} words.

Counts include article headings, FAQs, examples, source notes and related-resource text. They exclude the global header/footer, tool controls, calculator results and page hero. They are not measures of originality, accuracy, uniqueness or reading quality.

No exact competitor-per-page word-count parity is claimed. A matching competitor page must first be verified, fetched in full and counted on the same basis. Tools without an equivalent need a topic-specific editorial brief, not a fabricated competitor benchmark.

The CSV is sorted shortest first to prioritize editorial review. The dedicated matrix page stores its uses/examples in its component rather than JSON, so its zero JSON counts do not mean the content is missing.
'''
Path('reports/tool-content-depth.md').write_text(summary)
print(summary.split('\n')[2])
