import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy & Corrections",
  description: "How MapBench researches, writes, reviews and corrects its guides, tool explanations and geographic methodology.",
  alternates: { canonical: "/editorial-policy" },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "contact@mapbench.site";

export default function EditorialPolicyPage() {
  return (
    <div className="doc mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Editorial Policy &amp; Corrections</h1>
      <p className="mt-3 text-mute">MapBench publishes practical geographic tools and explanatory guides. This page describes how we keep that material useful, transparent and correct.</p>

      <h2>What we publish</h2>
      <p>Our editorial content explains mapping concepts, coordinate systems, routing, GPS files, geographic measurements and the practical limits of the tools on this site. Articles are written for a specific user question rather than to fill a word-count target.</p>

      <h2>How we review technical claims</h2>
      <p>Technical statements are checked against the calculation implemented by the tool and, where relevant, the documented upstream dataset or service. We distinguish geometric estimates from road-network results, administrative data and legally authoritative boundaries.</p>
      <p>For formulas, datasets and licences, see <Link href="/methodology" className="font-bold text-brand-strong hover:underline">Methodology</Link> and <Link href="/data-sources" className="font-bold text-brand-strong hover:underline">Data Sources</Link>.</p>

      <h2>Originality</h2>
      <p>MapBench articles and tool explanations are created for MapBench. We do not publish scraped articles, spun copies or third-party text presented as our own. When an external dataset, standard or open-source service is relevant, it is identified rather than hidden.</p>

      <h2>Corrections</h2>
      <p>If a factual, calculation, data-source or wording error is reported, we reproduce the issue, compare it with the documented method or authoritative source, and correct the page when the report is valid. Material changes to data handling are also reflected in the Privacy Policy.</p>

      <h2>Limits and high-stakes use</h2>
      <p>MapBench is designed for everyday analysis, learning and planning. Unless a page explicitly says otherwise, results are not a substitute for licensed surveying, legal boundary determination, emergency response systems, aviation or maritime navigation, or other safety-critical professional work.</p>

      <h2>How to report a problem</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-brand-strong hover:underline">{CONTACT_EMAIL}</a> or use the{" "}
        <Link href="/contact" className="font-bold text-brand-strong hover:underline">Contact page</Link>. Include the affected URL, the input or example, the result you saw and the result you expected.
      </p>
    </div>
  );
}
