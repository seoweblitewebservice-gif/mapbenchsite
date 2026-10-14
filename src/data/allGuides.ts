import { GUIDES, type Guide } from "./guides";
import { GUIDES2 } from "./guides2";
import { GUIDES3 } from "./guides3";
import { GUIDES4 } from "./guides4";
import { GUIDES5 } from "./guides5";
import { GUIDES6 } from "./guides6";
import { GUIDES7 } from "./guides7";
import { GUIDE_ENRICHMENT } from "./guideEnrichment";

const baseGuides: Guide[] = [...GUIDES, ...GUIDES2, ...GUIDES3, ...GUIDES4, ...GUIDES5, ...GUIDES6, ...GUIDES7];

export const ALL_GUIDES: Guide[] = baseGuides
  .map((guide) => {
    const enrichment = GUIDE_ENRICHMENT[guide.slug];
    if (!enrichment?.length) return guide;

    const toolbox = guide.blocks.filter((b) => b.t === "toolbox");
    const coreBlocks = guide.blocks.filter((b) => b.t !== "toolbox");

    return {
      ...guide,
      blocks: [...coreBlocks, ...enrichment, ...toolbox],
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const allGuideBySlug = new Map(ALL_GUIDES.map((g) => [g.slug, g]));
