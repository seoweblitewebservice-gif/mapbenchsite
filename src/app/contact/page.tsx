import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact MapBench",
  description: "Contact MapBench about geographic tools, map data, bugs, editorial corrections, accessibility or privacy questions.",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
};

const ISSUE_TRACKER = "https://github.com/seoweblitewebservice-gif/mapbenchsite/issues";
const SUPPORT_EMAIL = "support@mapbench.site";
const CONTACT_EMAIL = "contact@mapbench.site";

export default function ContactPage() {
  return (
    <div className="doc mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-mute">
        <Link href="/" className="hover:text-brand-strong">Home</Link> / Contact
      </nav>
      <h1 className="font-display text-3xl font-bold tracking-tight">Contact MapBench</h1>
      <p className="mt-3">
        Contact us about broken tools, inaccurate results, editorial corrections, accessibility, map data, privacy or general questions.
        For reproducible technical issues, you can also use the public issue tracker.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="sect-h">Support</h2>
          <p className="mt-2 text-sm text-mute">Tool bugs, data problems, access issues and technical support.</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 inline-block font-bold text-brand-strong hover:underline">{SUPPORT_EMAIL}</a>
        </div>
        <div className="card p-5">
          <h2 className="sect-h">General &amp; editorial</h2>
          <p className="mt-2 text-sm text-mute">General enquiries, editorial corrections, partnerships and privacy questions.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-block font-bold text-brand-strong hover:underline">{CONTACT_EMAIL}</a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="sect-h">Report a technical, data or content issue</h2>
        <p className="mt-3">
          Include the exact MapBench URL, what you entered or read, what you expected and what happened instead. For factual or editorial corrections,
          include the sentence or claim in question and, when possible, the authoritative reference you are comparing it with.
        </p>
        <p className="mt-4">
          <a href={ISSUE_TRACKER} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-md border border-line px-4 py-2 font-bold text-brand-strong transition-colors hover:border-brand">
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
          MapBench reviews valid factual and technical corrections. Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-brand-strong hover:underline">{CONTACT_EMAIL}</a> or review our{" "}
          <Link href="/editorial-policy" className="font-bold text-brand-strong hover:underline">Editorial Policy &amp; Corrections</Link>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="sect-h">Privacy and sensitive information</h2>
        <p className="mt-3">
          Review the <Link href="/privacy" className="font-bold text-brand-strong hover:underline">Privacy Policy</Link> before sharing any information.
          Do not send passwords, payment details, confidential files or other unnecessary sensitive data. The GitHub issue tracker is public, so use email for private enquiries.
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
