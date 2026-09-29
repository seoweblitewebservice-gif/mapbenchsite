import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/registry";

export const metadata: Metadata = {
  title: "About MapBench",
  description: "MapBench is a free, browser-first platform of geographic tools: distance and area calculators, routing, coordinate converters, map file viewers and map makers.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">About MapBench</h1>
      <div className="prose-sf mt-6">
        <p>
          MapBench exists for one simple reason: geographic questions are everyday questions. <em>How far apart are these two towns?
          What county am I standing in? How big is this field? What&apos;s inside my delivery radius?</em> Answering them shouldn&apos;t
          require a GIS license, a subscription, or handing your data to an unknown server.
        </p>
        <p>
          MapBench currently maintains <strong>{TOOLS.length} free tools</strong>. Some calculations run entirely in your browser;
          tools that need live routing, geocoding, elevation or place data use the external services documented on our Data Sources page.
          We describe those dependencies rather than presenting every result as locally computed or authoritative.
        </p>

        <h2>What we optimise for</h2>
        <ul>
          <li><strong>Correctness</strong> — appropriate geographic math, clear assumptions and visible methodology.</li>
          <li><strong>Privacy</strong> — no account is required for the public tools, and file-processing behaviour is explained where relevant.</li>
          <li><strong>Clarity</strong> — focused pages, readable outputs and explanations written for the specific question a tool answers.</li>
          <li><strong>Open data</strong> — sources such as OpenStreetMap, Natural Earth, the US Census Bureau and other documented providers are identified and attributed.</li>
        </ul>

        <h2>Editorial standards and corrections</h2>
        <p>
          Our guides and tool explanations are created for MapBench. We do not publish scraped articles or spun copies of third-party material.
          Technical claims are checked against the implemented method and the relevant source data, and we correct valid factual or calculation errors when they are reported.
          Read the full <Link href="/editorial-policy" className="font-semibold text-brand-strong hover:underline">Editorial Policy &amp; Corrections</Link>.
        </p>

        <h2>Honesty by design</h2>
        <p>
          Where a number is an estimate, we say so. Routing times are labelled as estimates when live traffic is unavailable, and geographic boundaries from open datasets are not presented as legal survey determinations.
          The details live on the <Link href="/methodology" className="font-semibold text-brand-strong hover:underline">Methodology</Link> and{" "}
          <Link href="/data-sources" className="font-semibold text-brand-strong hover:underline">Data Sources</Link> pages.
        </p>

        <h2>Why the name MapBench?</h2>
        <p>
          A workbench is where useful tools are kept within reach. MapBench brings practical mapping, measurement and geographic
          utilities together so you can answer a question, inspect data or make a map without setting up specialist GIS software.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/tools" className="btn btn-primary">Explore the tools</Link>
        <Link href="/editorial-policy" className="btn btn-ghost">Editorial policy</Link>
        <Link href="/contact" className="btn btn-ghost">Contact</Link>
      </div>
    </div>
  );
}
