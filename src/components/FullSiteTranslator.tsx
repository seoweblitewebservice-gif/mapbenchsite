"use client";

import { useEffect } from "react";

const INCLUDED_LANGUAGES = [
  "es","fr","de","it","pt","nl","pl","ru","uk","tr",
  "ar","fa","he","hi","bn","ur","pa","gu","mr","ta",
  "te","ml","kn","ne","si","th","vi","id","ms","tl",
  "zh-CN","zh-TW","ja","ko","sv","da","no","fi","cs","sk",
  "hu","ro","bg","el","hr","sr","sl","et","lv","lt"
].join(",");

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export default function FullSiteTranslator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.googleTranslateElementInit = () => {
      const Ctor = window.google?.translate?.TranslateElement;
      const host = document.getElementById("google_translate_element");
      if (!Ctor || !host || host.childElementCount > 0) return;
      new Ctor(
        {
          pageLanguage: "en",
          includedLanguages: INCLUDED_LANGUAGES,
          autoDisplay: false,
          layout: 0,
        },
        "google_translate_element",
      );
      window.dispatchEvent(new Event("mapbench-translator-ready"));
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-mapbench-google-translate="1"]');
    if (existing) {
      if (window.google?.translate?.TranslateElement) window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;
    script.dataset.mapbenchGoogleTranslate = "1";
    document.head.appendChild(script);
  }, []);

  return (
    <div
      id="google_translate_element"
      className="mapbench-google-translate"
      aria-label="Translate MapBench"
    />
  );
}
