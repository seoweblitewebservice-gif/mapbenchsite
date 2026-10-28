/** Visible sections only; the order mirrors the editorial document. */
export default function ToolContentsNav({ uses, examples, reference, method, faq, related }: {
  uses: boolean; examples: boolean; reference: boolean; method: boolean; faq: boolean; related: boolean;
}) {
  const sections = [
    ["how-to-use", "How to use"],
    ...(uses ? [["use-cases", "Practical uses"]] : []),
    ...(examples ? [["worked-examples", "Worked examples"]] : []),
    ...(reference ? [["popular-table", "Reference table"]] : []),
    ["tool-guide", "Understanding the result"],
    ...(method ? [["method-and-limits", "Method & limits"]] : []),
    ...(faq ? [["faq", "Questions & answers"]] : []),
    ...(related ? [["related-tools", "Related tools"]] : []),
    ["trust", "Sources"],
  ];
  return <nav aria-label="On this page" className="contents-nav">
    <span className="text-xs font-bold uppercase tracking-wider text-mute">On this page</span>
    <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{sections.map(([id, label]) =>
      <li key={id}><a href={`#${id}`} className="text-sm font-semibold text-brand-strong hover:underline">{label}</a></li>
    )}</ol>
  </nav>;
}
