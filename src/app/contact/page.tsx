import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact MapBench",
  description: "Contact MapBench about geographic tools, map data, bugs, editorial corrections, accessibility or privacy questions.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

const ISSUE_TRACKER = "https://github.com/seoweblitewebservice-gif/mapbenchsite/issues";

export default function ContactPage() {
  return (
    <div className="doc mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link> / Contact
      </nav>
      <h1 className="font-display text-3xl font-bold tracking-tight">Contact MapBench</h1>
      <p className="mt-3">
        Use this page to report a broken tool, inaccurate result, editorial error, accessibility problem, map-data issue or privacy concern.
        MapBench currently uses a public issue tracker for reproducible reports so fixes and their status remain transparent.
      </p>

      <section className="mt-8">
        <h2 className="sect-h">Report a technical, data or content issue</h2>
        <p className="mt-3">
          Include the exact MapBench URL, what you entered or read, what you expected and what happened instead. For factual or editorial corrections,
          include the sentence or claim in question and, when possible, the authoritative reference you are comparing it with.
        </p>
        <p className="mt-4">
          <a
            href={ISSUE_TRACKER}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-md border border-line px-4 py-2 font-bold text-brand-strong transition-colors hover:border-brand"
          >
            Open the MapBench issue tracker →
          </a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="sect-h">What to include</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>The URL of the affected page, tool or guide.</li>
          <li>A short description of the problem and the result or wording you expected.</li>
          <li>Your browser/device when the issue appears to be technical.</li>
          <li>The relevant source, coordinate or dataset when reporting a geographic-data problem.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="sect-h">Editorial corrections</h2>
        <p className="mt-3">
          MapBench reviews valid factual and technical corrections. Our standards for original content, source transparency and corrections are described in the{" "}
          <Link href="/editorial-policy" className="font-bold text-brand-strong hover:underline">Editorial Policy &amp; Corrections</Link>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="sect-h">Privacy and sensitive information</h2>
        <p className="mt-3">
          Review the <Link href="/privacy" className="font-bold text-brand-strong hover:underline">Privacy Policy</Link> before sharing any information.
          The issue tracker is public, so do not post passwords, private addresses, personal identifiers, confidential files or other sensitive data.
          Use a generic reproduction example whenever possible.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-line p-5">
        <h2 className="sect-h">Methods and sources</h2>
        <p className="mt-3">
          For how calculations are performed and where geographic data comes from, see our{" "}
          <Link href="/methodology" className="font-bold text-brand-strong hover:underline">Methodology</Link> and{" "}
          <Link href="/data-sources" className="font-bold text-brand-strong hover:underline">Data Sources</Link> pages.
        </p>
      </section>
    </div>
  );
}
