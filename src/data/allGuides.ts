import { GUIDES, type Guide } from "./guides";
import { GUIDES2 } from "./guides2";
import { GUIDES3 } from "./guides3";
import { GUIDES4 } from "./guides4";
import { GUIDES5 } from "./guides5";
import { GUIDES6 } from "./guides6";

export const ALL_GUIDES: Guide[] = [...GUIDES, ...GUIDES2, ...GUIDES3, ...GUIDES4, ...GUIDES5, ...GUIDES6].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);
export const allGuideBySlug = new Map(ALL_GUIDES.map((g) => [g.slug, g]));
