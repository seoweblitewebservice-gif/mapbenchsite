"use client";
import { Suspense, useEffect, useRef, useState } from "react";
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
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-mute">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href={prefix || "/"} className="hover:text-brand-strong">{homeLabel}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={prefix + "/tools"} className="hover:text-brand-strong">{toolsLabel}</Link></li>
          {category && (<><li aria-hidden>/</li><li><Link href={prefix + "/tools?cat=" + category.id} className="hover:text-brand-strong">{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</Link></li></>)}
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-ink">{localized?.name ?? tool.name}</li>
        </ol>
      </nav>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{localized?.name ?? tool.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mute">{localized?.intro ?? tool.intro}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className="chip chip-brand">{ui?.free ?? "Free"}</span>
          <span className="chip">{tool.scope}</span>
          <ShareControls locale={locale} />
        </div>
      </div>

      {Component && (
        <Suspense fallback={<div className="card flex h-80 items-center justify-center"><Spinner label="Loading tool…" /></div>}>
          <Component params={tool.props} />
        </Suspense>
      )}

      <div className="mt-10">
        {localized ? (
          <section className="doc space-y-6" aria-label="Tool explanation">
            <section>
              <h2 className="sect-h">{ui?.quickAnswer ?? "Quick answer"}</h2>
              <p className="mt-3 text-mute">{localized.quickAnswer}</p>
            </section>
            <section>
              <h2 className="sect-h">{localized.longForm.title}</h2>
              {localized.longForm.paras.map((paragraph, i) => <p key={i} className="mt-3 text-mute leading-relaxed">{paragraph}</p>)}
            </section>
          </section>
        ) : <ToolContent tool={tool} />}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="howto">
            <h2 id="howto" className="font-display text-xl font-bold">{ui?.howTo ?? "How to use"}</h2>
            <ol className="mt-3 space-y-2.5">
              {(localized?.howTo ?? tool.howTo).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-mute">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-strong">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {tool.method && (!locale || localized?.method) && (
            <section aria-labelledby="method">
              <h2 id="method" className="font-display text-xl font-bold">{ui?.methodology ?? "Methodology & accuracy"}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mute">{localized?.method ?? tool.method} Read more on the <Link href={prefix + "/methodology"} className="font-semibold text-brand-strong hover:underline">methodology page</Link>.</p>
            </section>
          )}

          {faqs.length > 0 && (
            <section aria-labelledby="faq">
              <h2 id="faq" className="font-display text-xl font-bold">{ui?.faq ?? "Frequently asked questions"}</h2>
              <div className="mt-3 space-y-2">
                {faqs.map(([q, a]) => (
                  <details key={q} className="card group px-4 py-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                      <span className="mr-2 text-brand-strong" aria-hidden>+</span>{q}
                    </summary>
                    <p className="mt-2 border-t border-line pt-2 text-sm leading-relaxed text-mute">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="related">
            <h2 id="related" className="font-display text-xl font-bold">{ui?.relatedTools ?? "Related tools"}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(locale ? related.filter(r => !!getLocalizedTool(locale, r.slug)) : related).map((r) => (
                <Link key={r.slug} href={prefix + "/tools/" + r.slug} className="card group p-4 transition-colors hover:border-brand">
                  <div className="text-sm font-bold group-hover:text-brand-strong">{locale ? getLocalizedTool(locale, r.slug)?.name : r.name}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{locale ? getLocalizedTool(locale, r.slug)?.short : r.short}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="label">{ui?.dataPrivacy ?? "Data & privacy"}</div>
            <ul className="mt-1 space-y-2 text-xs leading-relaxed text-mute">
              {locale ? null : <><li>✓ Browser-first processing where the tool supports it</li><li>✓ Map data and external services are documented</li><li>✓ No account required for public tools</li><li>✓ See <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">data sources</Link> &amp; <Link href="/privacy" className="font-semibold text-brand-strong hover:underline">privacy</Link></li></>}{locale && <li>✓ {ui?.dataPrivacy}</li>}
            </ul>
          </div>
          <div className="card p-4">
            <div className="label">{ui?.category ?? "Category"}</div>
            {category && (
              <>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.tone }} />{locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label}</div>
                {!locale && <p className="mt-2 text-xs leading-relaxed text-mute">{category.short}</p>}
                <Link href={prefix + "/tools?cat=" + category.id} className="mt-2 inline-block text-xs font-bold text-brand-strong hover:underline">{ui?.browseAll ?? "Browse all"} {locale ? CATEGORY_LABELS[locale][category.id] ?? category.label : category.label} →</Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ShareControls({ locale }: { locale?: Locale }) {
  return (
    <>
      <button
        type="button" className="btn btn-ghost btn-sm"
        onClick={async (e) => {
          const btn = e.currentTarget;
          try { await navigator.clipboard.writeText(window.location.href); btn.textContent = locale ? getLocaleUI(locale).copyLink + " ✓" : "Link copied ✓"; }
          catch { btn.textContent = locale ? getLocaleUI(locale).copyLink : "Copy the address bar"; }
          setTimeout(() => { btn.textContent = locale ? getLocaleUI(locale).copyLink : "Copy link"; }, 1600);
        }}
      >
        {locale ? getLocaleUI(locale).copyLink : "Copy link"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { window.location.href = window.location.pathname; }}>
        {locale ? getLocaleUI(locale).reset : "Reset"}
      </button>
    </>
  );
}
