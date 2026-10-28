import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/registry";

/** Crawlable, task-first index. Counts and links share the canonical registry. */
export default function HomeToolIndex() {
  return <div className="home-directory mx-auto max-w-5xl px-4 pb-12">
    <nav id="legend" aria-label="Tool categories" className="category-legend">
      <h2 className="home-category-title">Browse map tools by category</h2><p className="home-category-intro">Explore the complete collection of free map and geographic tools.</p>
      <div className="flex flex-wrap gap-2">{CATEGORIES.map(category => <a key={category.id} href={`#category-${category.id}`} className="category-pill"><span aria-hidden style={{ background: category.tone }} /><span className="category-pill-label">{category.label}<small>{category.short}</small></span><b aria-hidden>→</b></a>)}</div>
    </nav>
    {CATEGORIES.map(category => {
      const tools = TOOLS.filter(tool => tool.category === category.id);
      return <section id={`category-${category.id}`} key={category.id} className="directory-section" aria-labelledby={`heading-${category.id}`}>
        <div className="flex items-center gap-3"><span className="category-mark" style={{ background: category.tone }} aria-hidden /><h2 id={`heading-${category.id}`} className="text-xl font-bold tracking-tight">{category.label}</h2><span className="directory-count">{tools.length}</span></div>
        <p className="mt-2 text-sm text-mute">{category.short}</p>
        <div className="directory-links">{tools.map(tool => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="directory-tool"><div className="flex items-start justify-between gap-2"><h3>{tool.name}</h3>{tool.scope !== "Worldwide" && <span className="scope-label">{tool.scope === "US focused" ? "US" : tool.scope}</span>}</div><p>{tool.short}</p></Link>)}</div>
        <a href="#legend" className="mt-5 inline-block text-xs font-semibold text-brand-strong hover:underline">↑ All categories</a>
      </section>;
    })}
  </div>;
}
