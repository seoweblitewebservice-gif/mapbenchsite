import Link from "next/link";
import { CATEGORIES, TOOLS, type CategoryId } from "@/lib/registry";

const ICONS: Record<CategoryId, string> = {
  location: "⌖", distance: "↗", routing: "➜", radius: "◉",
  coordinates: "⊕", files: "▤", creation: "✎", earth: "▲",
  sun: "☀", lines: "◎", population: "▥", network: "⌘",
};

/** Category hubs link to the complete, registry-backed tool collections. */
export default function HomeToolIndex() {
  return <section className="home-directory mx-auto max-w-5xl px-4 pb-12" aria-labelledby="home-categories-title">
    <div id="legend" className="category-legend">
      <div className="home-category-heading">
        <div><h2 id="home-categories-title" className="home-category-title">Browse Map Tools by Category</h2><p className="home-category-intro">Explore our collection of free map tools. Choose a category to find the right tool.</p></div>
        <Link href="/tools" className="home-all-tools">View all tools <span aria-hidden>→</span></Link>
      </div>
      <div className="home-category-grid">{CATEGORIES.map(category => {
        const count = TOOLS.filter(tool => tool.category === category.id).length;
        return <Link key={category.id} href={`/tools/category/${category.id}`} className={`home-category-card home-category-${category.id}`}>
          <span className="home-category-icon" aria-hidden>{ICONS[category.id]}</span>
          <span className="home-category-copy"><span className="home-category-name">{category.label}</span><span className="home-category-description">{category.short}</span><span className="home-category-count">{count} tools</span></span>
          <span className="home-category-arrow" aria-hidden>›</span>
        </Link>;
      })}</div>
    </div>
  </section>;
}

/** Every tool remains visible as a crawlable link with its original description. */
export function HomeFullDirectory() {
  return <section className="home-full-directory" aria-labelledby="home-directory-title">
    <div className="home-section-heading"><div><h2 id="home-directory-title">Explore all map tools</h2><p>Browse the complete directory by geographic task.</p></div><Link href="/tools" className="home-section-link">Search all tools →</Link></div>
    {CATEGORIES.map(category => {
      const tools = TOOLS.filter(tool => tool.category === category.id);
      return <section key={category.id} id={`category-${category.id}`} className="home-directory-section" aria-labelledby={`heading-${category.id}`}>
        <div className="home-directory-heading"><span className={`home-category-icon home-category-${category.id}`} aria-hidden>{ICONS[category.id]}</span><div><h3 id={`heading-${category.id}`}>{category.label} <span className="home-directory-count">{tools.length} tools</span></h3><p>{category.short}</p></div><Link href={`/tools/category/${category.id}`} className="home-section-link">Category guide →</Link></div>
        <div className="home-directory-list">{tools.map(tool => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="home-directory-item"><h4>{tool.name} {tool.scope !== "Worldwide" && <span className="scope-label">{tool.scope === "US focused" ? "US" : tool.scope}</span>}</h4><p>{tool.short}</p></Link>)}</div>
        <a href="#legend" className="home-back-categories">↑ All categories</a>
      </section>;
    })}
  </section>;
}
