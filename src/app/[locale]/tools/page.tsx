import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { isLocale, LOCALES, getLocaleUI, CATEGORY_LABELS } from "@/lib/i18n";
import { isToolLocalized, getLocalizedTool, localizedToolSlugs } from "@/data/localizedTools";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const BASE="https://www.mapbench.site";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  if(!isLocale(locale))return{};
  const ui=getLocaleUI(locale);
  const languages: Record<string,string>={en:`${BASE}/tools`,"x-default":`${BASE}/tools`};
  for(const l of LOCALES){
    if(localizedToolSlugs(l).length>0) languages[l]=`${BASE}/${l}/tools`;
  }
  return {
    title:`${ui.mapTools} · MapBench`,
    description:ui.browseDirectory,
    robots:{index:true,follow:true},
    alternates:{canonical:`/${locale}/tools`,languages}
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
    {CATEGORIES.map(c=>{
      const items=TOOLS.filter(t=>t.category===c.id && isToolLocalized(locale,t.slug));
      if(!items.length)return null;
      return <section key={c.id} className="mt-8"><h2 className="sect-h">{CATEGORY_LABELS[locale][c.id] ?? c.label}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(t=><Link key={t.slug} href={`/${locale}/tools/${t.slug}`} className="card p-4"><div className="font-bold">{getLocalizedTool(locale,t.slug)?.name ?? t.name}</div><p className="mt-1 text-xs text-mute">{getLocalizedTool(locale,t.slug)?.short ?? t.short}</p></Link>)}</div></section>;
    })}
    {!localizedCount && <div className="mt-6 rounded-lg border border-line bg-card p-4 text-sm text-mute">Tool translations for this language are still being expanded. Browse this language directory while more localized tool content is added.</div>}
  </div>;
}
