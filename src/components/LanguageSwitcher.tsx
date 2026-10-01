"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const LANGUAGES = [
  ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"],
  ["pt", "Português"], ["nl", "Nederlands"], ["pl", "Polski"], ["ru", "Русский"], ["uk", "Українська"],
  ["tr", "Türkçe"], ["ar", "العربية"], ["fa", "فارسی"], ["he", "עברית"], ["hi", "हिन्दी"],
  ["bn", "বাংলা"], ["ur", "اردو"], ["pa", "ਪੰਜਾਬੀ"], ["gu", "ગુજરાતી"], ["mr", "मराठी"],
  ["ta", "தமிழ்"], ["te", "తెలుగు"], ["ml", "മലയാളം"], ["kn", "ಕನ್ನಡ"], ["ne", "नेपाली"],
  ["si", "සිංහල"], ["th", "ไทย"], ["vi", "Tiếng Việt"], ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"],
  ["tl", "Filipino"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"], ["ja", "日本語"], ["ko", "한국어"],
  ["sv", "Svenska"], ["da", "Dansk"], ["no", "Norsk"], ["fi", "Suomi"], ["cs", "Čeština"],
  ["sk", "Slovenčina"], ["hu", "Magyar"], ["ro", "Română"], ["bg", "Български"], ["el", "Ελληνικά"],
  ["hr", "Hrvatski"], ["sr", "Српски"], ["sl", "Slovenščina"], ["et", "Eesti"], ["lv", "Latviešu"], ["lt", "Lietuvių"],
] as const;

const ROUTE_LOCALES = new Set(["es","de","fr","it","pt","nl","pl","ru","sv","da","no","fi","cs","ro","el","hu","tr","uk","ar","ja","ko","zh","hi"]);

function englishPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && ROUTE_LOCALES.has(parts[0])) parts.shift();
  return parts.length ? `/${parts.join("/")}` : "/";
}

function readGoogleLanguage() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return match?.[1] || "en";
}

function setGoogleLanguage(code: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  if (code === "en") {
    document.cookie = `googtrans=; Max-Age=0; path=/; SameSite=Lax${secure}`;
    document.cookie = `googtrans=; Max-Age=0; path=/; domain=.mapbench.site; SameSite=Lax${secure}`;
    return;
  }
  const value = `/en/${code}`;
  document.cookie = `googtrans=${value}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  if (location.hostname.endsWith("mapbench.site")) {
    document.cookie = `googtrans=${value}; path=/; domain=.mapbench.site; max-age=31536000; SameSite=Lax${secure}`;
  }
}

export default function LanguageSwitcher({ locale: _locale }: { locale?: string } = {}) {
  void _locale;
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setCurrent(readGoogleLanguage()), [pathname]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (code: string) => {
    setOpen(false);
    setGoogleLanguage(code);
    try { localStorage.setItem("mapbench-language", code); } catch {}
    const target = englishPath(pathname);
    if (location.pathname !== target) location.href = target;
    else location.reload();
  };

  const currentName = LANGUAGES.find(([code]) => code === current)?.[1] ?? "English";

  return (
    <div ref={ref} className="relative notranslate" translate="no">
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1.5"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Translate MapBench"
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9s1.3-6.2 3.8-9z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="max-w-28 truncate text-[12px] font-extrabold">{currentName}</span>
        <span aria-hidden className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <div role="listbox" aria-label="Languages" className="absolute right-0 top-full z-[80] mt-1 max-h-[72vh] w-64 overflow-y-auto rounded-lg border border-line bg-card py-1 shadow-xl">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-mute">Translate entire website</div>
          {LANGUAGES.map(([code, name]) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={current === code}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] font-semibold hover:bg-brand-soft ${current === code ? "text-brand-strong" : "text-ink"}`}
              onClick={() => choose(code)}
            >
              <span><span className="mr-2 inline-block w-10 text-[10px] font-extrabold uppercase text-mute">{code}</span>{name}</span>
              {current === code && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
