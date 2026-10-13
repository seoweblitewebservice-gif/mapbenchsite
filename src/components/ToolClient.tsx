"use client";
import { Suspense } from "react";
import Link from "next/link";
import { toolBySlug, CATEGORIES, type ToolDef } from "@/lib/registry";
import ToolContent from "./ToolContent";
import { toolComponents } from "./tools";
import { Spinner } from "./ui";
import { getLocalizedTool } from "@/data/localizedTools";
import type { Locale } from "@/lib/i18n";
import { getLocaleUI, CATEGORY_LABELS } from "@/lib/i18n";

export default function ToolClient({ slug, locale }: { slug: string; locale?: Locale }) {
  const tool = toolBySlug.get(slug);
  const localized = locale ? getLocalizedTool(locale, slug) : undefined;
  const ui = locale ? getLocaleUI(locale) : null;
  const prefix = locale ? `/${locale}` : "";
  const homeLabel = locale ? ({
    es: "Inicio", de: "Startseite", fr: "Accueil", it: "Home", pt: "Início", nl: "Home",
    pl: "Strona główna", ru: "Главная", sv: "Hem", da: "Forside", no: "Hjem", fi: "Etusivu",
    cs: "Domů", ro: "Acasă", el: "Αρχική", hu: "Kezdőlap", tr: "Ana sayfa", uk: "Головна",
    ar: "الرئيسية", ja: "ホーム", ko: "홈", zh: "首页", hi: "होम",
  } as Record<Locale, string>)[locale] : "Home";
  const toolsLabel = locale ? ({
    es: "Herramientas", de: "Werkzeuge", fr: "Outils", it: "Strumenti", pt: "Ferramentas", nl: "Tools",
    pl: "Narzędzia", ru: "Инструменты", sv: "Verktyg", da: "Værktøjer", no: "Verktøy", fi: "Työkalut",
    cs: "Nástroje", ro: "Instrumente", el: "Εργαλεία", hu: "Eszközök", tr: "Araçlar", uk: "Інструменти",
    ar: "الأدوات", ja: "ツール", ko: "도구", zh: "工具", hi: "टूल्स",
  } as Record<Locale, string>)[locale] : "Tools";
  if (!tool) return null;
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const Component = toolComponents[tool.component];
  const related = tool.related.map((s) => toolBySlug.get(s)).filter((t): t is ToolDef => !!t && t.slug !== slug).slice(0, 6);
  const faqs: [string, string][] = localized ? localized.faq : tool.faq;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href={prefix || "/"} className="hover:text-brand-strong">{homeLabel}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={prefix + "/tools"} className="hover:text-brand-strong">{toolsLabel}</Link></li>
          {category && (<><li aria-hidden>/</li><li><Link href={prefix + "/tools/category/" + category.id} className="hover:text-brand-strong">{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</Link></li></>)}
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">{localized?.name ?? tool.name}</li>
        </ol>
      </nav>

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-white to-brand-soft/40 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.07)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-soft/70 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">Interactive tool</span>
              {category && <span className="rounded-full border border-line bg-white/80 px-2.5 py-1 text-[10px] font-bold text-mute">{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</span>}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{localized?.name ?? tool.name}</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">{localized?.intro ?? tool.intro}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-mute">
              <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ No account required</span>
              <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ {tool.scope}</span>
              <span className="rounded-lg border border-line bg-white/80 px-2.5 py-1.5">✓ Shareable results</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ShareControls locale={locale} />
          </div>
        </div>
      </section>

      {Component && (
        <section className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-well/60 to-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-strong" aria-hidden>⌁</span>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Tool workspace</div>
                <div className="text-[11px] text-mute">Change inputs and results update here</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-[11px] text-mute sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ready</div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            <Suspense fallback={<div className="flex h-80 items-center justify-center"><Spinner label="Loading tool…" /></div>}>
              <Component params={tool.props} />
            </Suspense>
          </div>
        </section>
      )}

      <div className="mt-10">
        {localized ? (
          <section className="doc space-y-6" aria-label="Tool explanation">
            <section><h2 className="sect-h">{ui?.quickAnswer ?? "Quick answer"}</h2><p className="mt-3 text-mute">{localized.quickAnswer}</p></section>
            <section><h2 className="sect-h">{localized.longForm.title}</h2>{localized.longForm.paras.map((paragraph, i) => <p key={i} className="mt-3 text-mute leading-relaxed">{paragraph}</p>)}</section>
          </section>
        ) : <ToolContent tool={tool} />}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="howto" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 id="howto" className="font-display text-xl font-bold">{ui?.howTo ?? "How to use"}</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {(localized?.howTo ?? tool.howTo).map((step, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-well/55 p-3 text-sm leading-relaxed text-mute">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-extrabold text-brand-strong">{i + 1}</span>{step}
                </li>
              ))}
            </ol>
          </section>

          {tool.method && (!locale || localized?.method) && (
            <section aria-labelledby="method" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h2 id="method" className="font-display text-xl font-bold">{ui?.methodology ?? "Methodology & accuracy"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{localized?.method ?? tool.method} Read more on the <Link href={prefix + "/methodology"} className="font-semibold text-brand-strong hover:underline">methodology page</Link>.</p>
            </section>
          )}

          {faqs.length > 0 && (
            <section aria-labelledby="faq"><h2 id="faq" className="font-display text-xl font-bold">{ui?.faq ?? "Frequently asked questions"}</h2><div className="mt-3 space-y-2">{faqs.map(([q, a]) => <details key={q} className="card group rounded-xl px-4 py-3"><summary className="cursor-pointer list-none text-sm font-semibold marker:hidden"><span className="mr-2 text-brand-strong" aria-hidden>+</span>{q}</summary><p className="mt-2 border-t border-line pt-2 text-sm leading-relaxed text-mute">{a}</p></details>)}</div></section>
          )}

          <section aria-labelledby="related"><h2 id="related" className="font-display text-xl font-bold">{ui?.relatedTools ?? "Related tools"}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{(locale ? related.filter(r => !!getLocalizedTool(locale, r.slug)) : related).map((r) => <Link key={r.slug} href={prefix + "/tools/" + r.slug} className="card group rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"><div className="text-sm font-bold group-hover:text-brand-strong">{locale ? getLocalizedTool(locale, r.slug)?.name : r.name}</div><div className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{locale ? getLocalizedTool(locale, r.slug)?.short : r.short}</div></Link>)}</div></section>
        </div>

        <aside className="space-y-4">
          <div className="card rounded-2xl p-4"><div className="label">{ui?.dataPrivacy ?? "Data & privacy"}</div><ul className="mt-2 space-y-2 text-xs leading-relaxed text-mute">{locale ? null : <><li>✓ Browser-first processing where supported</li><li>✓ External data sources are documented</li><li>✓ No account required</li><li>✓ See <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">data sources</Link> &amp; <Link href="/privacy" className="font-semibold text-brand-strong hover:underline">privacy</Link></li></>}{locale && <li>✓ {ui?.dataPrivacy}</li>}</ul></div>
          <div className="card rounded-2xl p-4"><div className="label">{ui?.category ?? "Category"}</div>{category && <><div className="mt-2 flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.tone }} />{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</div>{!locale && <p className="mt-2 text-xs leading-relaxed text-mute">{category.short}</p>}<Link href={prefix + "/tools/category/" + category.id} className="mt-3 inline-block text-xs font-bold text-brand-strong hover:underline">{ui?.browseAll ?? "Browse all"} {locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label} →</Link></>}</div>
        </aside>
      </div>
    </div>
  );
}

function ShareControls({ locale }: { locale?: Locale }) {
  return <><button type="button" className="btn btn-ghost btn-sm" onClick={async (e) => { const btn=e.currentTarget; try { await navigator.clipboard.writeText(window.location.href); btn.textContent=locale ? getLocaleUI(locale).copyLink+" ✓" : "Link copied ✓"; } catch { btn.textContent=locale ? getLocaleUI(locale).copyLink : "Copy the address bar"; } setTimeout(()=>{btn.textContent=locale ? getLocaleUI(locale).copyLink : "Copy link";},1600); }}>{locale ? getLocaleUI(locale).copyLink : "Copy link"}</button><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{window.location.href=window.location.pathname;}}>{locale ? getLocaleUI(locale).reset : "Reset"}</button></>;
}
