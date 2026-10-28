import Link from "next/link";
import { contextLinks } from "@/lib/contextLinks";
import type { ToolDef } from "@/lib/registry";

export default function ContextualText({ text, tool }: { text: string; tool: ToolDef }) {
  return <>{contextLinks(text, tool).map((part, i) => part.href
    ? <Link key={i} href={part.href} className="editorial-link">{part.text}</Link>
    : <span key={i}>{part.text}</span>)}</>;
}
