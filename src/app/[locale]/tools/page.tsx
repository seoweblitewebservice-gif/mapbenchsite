import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { isLocale, LOCALES, getLocaleUI, CATEGORY_LABELS } from "@/lib/i18n";
import { isToolLocalized, getLocalizedTool, localizedToolSlugs } from "@/data/localizedTools";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const BASE="https://www.mapbench.site";
const MIN_INDEXABLE_LOCALIZED_TOOLS = 5;

function indexableLocales(){
  return LOCALES.filter((l)=>localizedToolSlugs(l).length >= MIN_INDEXABLE_LOCALIZED_TOOLS);
}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  if(!isLocale(locale))return{};
  const ui=getLocaleUI(locale);
  const indexable=localizedToolSlugs(locale).length >= MIN_INDEXABLE_LOCALIZED_TOOLS;
  const languages: Record<string,string>={en:`${BASE}/tools`,"x-default":`${BASE}/tools`};
  for(const l of indexableLocales()) languages[l]=`${BASE}/${l}/tools`;
  return {
    title:`${ui.mapTools} · MapBench`,
    description:ui.browseDirectory,
    robots:{index:indexable,follow:true},
    alternates:{canonical:indexable?`/${locale}/tools`:"/tools",languages}
  };
}

export default async function LocalizedTools({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  const ui=getLocaleUI(locale);
  const localizedCount=localizedToolSlugs(locale).length;
  return <div className="doc" dir={locale==="ar"?"rtl":"ltr"}>
    <div className="mb-4 flex justify-end"><LanguageSwitcher locale={locale}/></div>
    <h1 className="font-display text-3xl font-bold">{ui.mapTools}</h1>
    <p className="mt-3 max-w-3xl text-mute">{ui.browseDirectory}</p>
    {localizedCount < MIN_INDEXABLE_LOCALIZED_TOOLS && <p className="mt-3 max-w-3xl text-sm text-mute">This language directory is not indexed until a meaningful set of fully translated tools is available. English remains the canonical directory.</p>}
    {CATEGORIES.map(c=>{
      const items=TOOLS.filter(t=>t.category===c.id && isToolLocalized(locale,t.slug));
      if(!items.length)return null;
      return <section key={c.id} className="mt-8"><h2 className="sect-h">{CATEGORY_LABELS[locale][c.id] ?? c.label}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(t=><Link key={t.slug} href={`/${locale}/tools/${t.slug}`} className="card p-4"><div className="font-bold">{getLocalizedTool(locale,t.slug)?.name ?? t.name}</div><p className="mt-1 text-xs text-mute">{getLocalizedTool(locale,t.slug)?.short ?? t.short}</p></Link>)}</div></section>;
    })}
    {!localizedCount && <div className="mt-6 rounded-lg border border-line bg-card p-4 text-sm text-mute">No fully translated tools are published in this language yet. Browse the English tool directory for complete coverage.</div>}
  </div>;
}
