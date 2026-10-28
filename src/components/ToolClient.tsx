"use client";
import { Suspense } from "react";
import Link from "next/link";
import { toolBySlug, CATEGORIES, type ToolDef } from "@/lib/registry";
import ToolContentsNav from "./ToolContentsNav";
import RelatedReading from "./RelatedReading";
import ToolContent from "./ToolContent";
import ToolMethod from "./ToolMethod";
import ToolPageExtras from "./ToolPageExtras";
import { toolComponents } from "./tools";
import { Spinner } from "./ui";
import { getLocalizedTool } from "@/data/localizedTools";
import type { Locale } from "@/lib/i18n";
import { getLocaleUI, CATEGORY_LABELS } from "@/lib/i18n";
import { getEnhancedFaqs } from "@/lib/toolFaqs";
import type { PageContent, ContentSegment } from "@/lib/pageContent";

function Segs({ parts }: { parts: ContentSegment[] }) {
  return <>{parts.map((p, i) => p.l
    ? <Link key={i} href={p.l} className="font-semibold text-brand-strong hover:underline">{p.t}</Link>
    : <span key={i}>{p.t}</span>)}</>;
}

export default function ToolClient({ slug, locale, pageContent, faqsOverride }: { slug: string; locale?: Locale; pageContent?: PageContent | null; faqsOverride?: [string, string][] }) {
  const tool = toolBySlug.get(slug);
  const localized = locale ? getLocalizedTool(locale, slug) : undefined;
  const ui = locale ? getLocaleUI(locale) : null;
  const prefix = locale ? `/${locale}` : "";
  const homeLabel = locale ? ({ es: "Inicio", de: "Startseite", fr: "Accueil", it: "Home", pt: "Início", nl: "Home", pl: "Strona główna", ru: "Главная", sv: "Hem", da: "Forside", no: "Hjem", fi: "Etusivu", cs: "Domů", ro: "Acasă", el: "Αρχική", hu: "Kezdőlap", tr: "Ana sayfa", uk: "Головна", ar: "الرئيسية", ja: "ホーム", ko: "홈", zh: "首页", hi: "होम" } as Record<Locale, string>)[locale] : "Home";
  const toolsLabel = locale ? ({ es: "Herramientas", de: "Werkzeuge", fr: "Outils", it: "Strumenti", pt: "Ferramentas", nl: "Tools", pl: "Narzędzia", ru: "Инструменты", sv: "Verktyg", da: "Værktøjer", no: "Verktøy", fi: "Työkalut", cs: "Nástroje", ro: "Instrumente", el: "Εργαλεία", hu: "Eszközök", tr: "Araçlar", uk: "Інструменти", ar: "الأدوات", ja: "ツール", ko: "도구", zh: "工具", hi: "टूल्स" } as Record<Locale, string>)[locale] : "Tools";
  if (!tool) return null;
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const Component = toolComponents[tool.component];
  const relatedSlugs = !locale && pageContent?.related?.length ? pageContent.related : tool.related;
  const related = relatedSlugs.map((s) => toolBySlug.get(s)).filter((t): t is ToolDef => !!t && t.slug !== slug).slice(0, 6);
  const pc = locale ? null : pageContent ?? null;
  const faqs: [string, string][] = faqsOverride && !locale ? faqsOverride : localized ? localized.faq : getEnhancedFaqs(tool);
  const visibleRelated = locale ? related.filter((r) => !!getLocalizedTool(locale, r.slug)) : related;

  return (
    <div className="tool-editorial">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute"><ol className="flex flex-wrap items-center gap-1.5"><li><Link href={prefix || "/"} className="hover:text-brand-strong">{homeLabel}</Link></li><li aria-hidden>/</li><li><Link href={prefix + "/tools"} className="hover:text-brand-strong">{toolsLabel}</Link></li>{category && (<><li aria-hidden>/</li><li><Link href={prefix + "/tools/category/" + category.id} className="hover:text-brand-strong">{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</Link></li></>)}<li aria-hidden>/</li><li aria-current="page" className="font-semibold text-ink">{localized?.name ?? tool.name}</li></ol></nav>

      <section className="relative mb-5 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-white to-brand-soft/35 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-7"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-soft/70 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Interactive tool</span>{category && <span className="rounded-full border border-line bg-white/80 px-2.5 py-1 text-[10px] font-bold text-mute">{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</span>}</div><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{localized?.name ?? tool.name}</h1><p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">{localized?.intro ?? tool.intro}</p>{pc && <p className="mt-3 text-xs text-mute">By <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link>, Founder &amp; Editor · Updated {pc.updated}</p>}<div className="mt-4 flex flex-wrap gap-2 text-xs text-mute"><span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ No account required</span><span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ {tool.scope}</span><span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ No installation required</span></div></div><div className="flex shrink-0 flex-wrap gap-2"><ShareControls locale={locale} /></div></div></section>



      {Component && <section className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_14px_42px_rgba(15,23,42,0.07)]"><div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-well/60 to-white px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-strong" aria-hidden>⌁</span><div><div className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Tool workspace</div><div className="text-[11px] text-mute">Set your inputs, inspect the map and read the result</div></div></div><div className="hidden items-center gap-2 text-[11px] text-mute sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ready</div></div><div className="p-4 sm:p-5 lg:p-6"><Suspense fallback={<div className="flex h-80 items-center justify-center"><Spinner label="Loading tool…" /></div>}><Component params={tool.props} /></Suspense></div></section>}

      {pc?.summary_sentence && <p className="mt-3 text-sm leading-relaxed text-mute">{pc.summary_sentence}</p>}

      <div className="editorial-body mx-auto mt-8 max-w-3xl">
        <ToolContentsNav uses={Boolean(pc?.use_cases?.length)} examples={Boolean(pc?.examples?.length)} reference={Boolean(pc?.popular_table)} method={!locale} faq={faqs.length > 0} related={visibleRelated.length > 0} />





        <section id="how-to-use" aria-labelledby="howto" className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6"><div className="mb-4"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Simple workflow</div><h2 id="howto" className="mt-1 font-display text-2xl font-bold">{pc?.primary_keyword ? `How to use ${pc.primary_keyword}` : ui?.howTo ?? "How to use this tool"}</h2>{pc?.steps_intro && <p className="mt-2 text-sm leading-relaxed text-mute">{pc.steps_intro}</p>}</div>{pc?.quick_answer && <p id="quick-answer" className="workflow-answer mb-5">{pc.quick_answer}</p>}<ol className="grid gap-4">{(localized?.howTo ?? tool.howTo).map((step, i) => <li key={i} className="flex gap-3 rounded-xl border border-line bg-well/35 p-4 text-sm leading-relaxed text-mute"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">{i + 1}</span><span className="pt-1">{step}</span></li>)}</ol></section>

        {pc?.use_cases && <section id="use-cases" aria-labelledby="uses-h" className="mt-10"><h2 id="uses-h" className="font-display text-2xl font-bold tracking-tight">What people use {tool.name} for</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{pc.use_cases.map((u, i) => <div key={u.title} className="rounded-xl border border-line bg-card p-4"><h3 className="font-bold"><span className="text-brand-strong">{i + 1}. </span>{u.title}</h3><p className="mt-2 text-sm leading-7 text-mute"><Segs parts={u.body} /></p></div>)}</div></section>}

        {pc?.examples?.length ? <section id="worked-examples" aria-labelledby="examples-heading" className="mt-10"><h2 id="examples-heading" className="font-display text-2xl font-bold">Worked examples</h2><div className="editorial-examples mt-4 grid gap-4">{pc.examples.map((e) => <div key={e.label} className="rounded-lg border-l-4 border-brand bg-well p-5"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">{e.label}</div><p className="mt-2 text-sm leading-7 text-mute"><Segs parts={e.body} /></p></div>)}</div></section> : null}

        {pc?.popular_table && <section id="popular-table" aria-labelledby="pt-h" className="mt-10"><h2 id="pt-h" className="font-display text-2xl font-bold tracking-tight">{pc.popular_table.title}</h2><p className="mt-3 text-sm leading-7 text-mute">{pc.popular_table.intro}</p><div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white"><table className="w-full min-w-[620px] text-sm"><thead className="bg-well/60 text-left text-[11px] uppercase tracking-wider text-mute"><tr>{pc.popular_table.columns.map((c) => <th key={c} scope="col" className="px-4 py-3">{c}</th>)}</tr></thead><tbody className="divide-y divide-line">{pc.popular_table.rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className={j < 2 ? "px-4 py-3 font-semibold" : "px-4 py-3"}>{cell}</td>)}</tr>)}</tbody></table></div>{pc.popular_table.note && <p className="mt-3 text-xs leading-relaxed text-mute">{pc.popular_table.note}</p>}</section>}


        <div id="tool-guide" className="mt-10">{localized ? <section className="doc space-y-8" aria-label="Tool explanation"><section><h2 className="sect-h">{ui?.quickAnswer ?? "Quick answer"}</h2><p className="mt-3 text-mute">{localized.quickAnswer}</p></section><section><h2 className="sect-h">{localized.longForm.title}</h2>{localized.longForm.paras.map((paragraph, i) => <p key={i} className="mt-3 text-mute leading-relaxed">{paragraph}</p>)}</section>{tool.method && localized.method && <section><h2 className="sect-h">{ui?.methodology ?? "Methodology & accuracy"}</h2><p className="mt-3 text-mute">{localized.method}</p></section>}</section> : <><ToolContent tool={tool} pageContent={pc} /><ToolPageExtras slug={slug} /></>}</div>



        {!locale && <ToolMethod tool={tool} />}

        {faqs.length > 0 && <section id="faq" aria-labelledby="faq-heading" className="mt-10"><div className="max-w-3xl"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Common questions</div><h2 id="faq-heading" className="mt-1 font-display text-2xl font-bold">{ui?.faq ?? "Frequently asked questions"}</h2><p className="mt-2 text-sm leading-relaxed text-mute">Clear answers about the calculation, accuracy and appropriate use.</p></div><div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">{faqs.map(([q, a]) => <details key={q} className="group px-5 py-4 open:bg-well/30"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold marker:hidden"><span>{q}</span><span className="text-xl font-light text-brand-strong transition-transform group-open:rotate-45" aria-hidden>+</span></summary><p className="max-w-3xl pt-3 text-sm leading-7 text-mute">{a}</p></details>)}</div></section>}

        {pc?.related_prose && <section aria-labelledby="relres-h" className="mt-10"><h2 id="relres-h" className="font-display text-2xl font-bold tracking-tight">Related tools and resources</h2><p className="mt-3 leading-7 text-mute"><Segs parts={pc.related_prose} /></p></section>}
        {!locale && <div className="mt-10"><RelatedReading tool={tool} /></div>}



        {pc && pc.more_tools.length > 0 && <section id="more-tools" className="mt-10" aria-labelledby="more-h"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Keep measuring</div><h2 id="more-h" className="mt-1 font-display text-2xl font-bold">More free tools</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{pc.more_tools.map((s) => toolBySlug.get(s)).filter((r): r is ToolDef => !!r && r.slug !== slug).map((r) => <Link key={r.slug} href={"/tools/" + r.slug} className="card group rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"><div className="text-sm font-bold group-hover:text-brand-strong">{r.name}</div><div className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{r.short}</div><span className="mt-2 block text-xs font-extrabold text-brand-strong">Open tool →</span></Link>)}</div></section>}

        {visibleRelated.length > 0 && <section id="related-tools" className="mt-10" aria-labelledby="related"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Continue your workflow</div><h2 id="related" className="mt-1 font-display text-2xl font-bold">{ui?.relatedTools ?? `Related tools for ${tool.name}`}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-mute">These tools answer adjacent geographic questions with a different method or dataset, so you can compare results instead of forcing one calculator to answer every question.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{visibleRelated.map((r) => { const localizedRelated = locale ? getLocalizedTool(locale, r.slug) : undefined; return <Link key={r.slug} href={prefix + "/tools/" + r.slug} className="card group rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"><div className="text-sm font-bold group-hover:text-brand-strong">{localizedRelated?.name ?? r.name}</div><div className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{localizedRelated?.short ?? r.short}</div><span className="mt-2 block text-xs font-extrabold text-brand-strong">Open tool →</span></Link>; })}</div></section>}
        <section id="trust" className="mt-10"><div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">How this page is maintained</div><h2 className="mt-1 font-display text-2xl font-bold">Sources, methodology &amp; editorial trust</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="label">Data &amp; privacy</div><ul className="mt-3 space-y-2 text-sm leading-relaxed text-mute">{locale ? <li>✓ {ui?.dataPrivacy}</li> : <><li>✓ Browser-first processing where supported</li><li>✓ External sources are documented</li><li>✓ No account required for public tools</li><li>✓ <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">Review data sources</Link></li></>}</ul></div><div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="label">Method &amp; review</div>{locale ? <p className="mt-3 text-sm leading-relaxed text-mute">Use the methodology notes on this page to understand assumptions and limits.</p> : <><p className="mt-3 text-sm leading-relaxed text-mute">Calculations are documented with their assumptions, limitations and source context rather than presented as unexplained answers.</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-sm"><Link href="/methodology" className="font-semibold text-brand-strong hover:underline">Methodology</Link><Link href="/editorial-policy" className="font-semibold text-brand-strong hover:underline">Editorial policy</Link></div></>}</div><div className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="label">Editor &amp; category</div>{!locale && <p className="mt-3 text-sm leading-relaxed text-mute">Reviewed and maintained by <Link href="/author/aryan-khan" className="font-semibold text-brand-strong hover:underline">Aryan Khan</Link>, Founder &amp; Editor of MapBench.</p>}{category && <><div className="mt-3 flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.tone }} />{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</div><Link href={prefix + "/tools/category/" + category.id} className="mt-3 inline-block text-sm font-bold text-brand-strong hover:underline">{ui?.browseAll ?? "Browse all"} {locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label} →</Link></>}</div></div></section>
      </div>
    </div>
  );
}

function ShareControls({ locale }: { locale?: Locale }) {
  return <><button type="button" className="btn btn-ghost btn-sm" onClick={async (e) => { const btn=e.currentTarget; try { await navigator.clipboard.writeText(window.location.href); btn.textContent=locale ? getLocaleUI(locale).copyLink+" ✓" : "Link copied ✓"; } catch { btn.textContent=locale ? getLocaleUI(locale).copyLink : "Copy the address bar"; } setTimeout(()=>{btn.textContent=locale ? getLocaleUI(locale).copyLink : "Copy link";},1600); }}>{locale ? getLocaleUI(locale).copyLink : "Copy link"}</button><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{window.location.href=window.location.pathname;}}>{locale ? getLocaleUI(locale).reset : "Reset"}</button></>;
}
