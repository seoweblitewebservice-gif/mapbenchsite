import { GUIDES, type Guide } from "./guides";
import { GUIDES2 } from "./guides2";
import { GUIDES3 } from "./guides3";
import { GUIDES4 } from "./guides4";
import { GUIDES5 } from "./guides5";
import { GUIDES6 } from "./guides6";
import { GUIDES7 } from "./guides7";
import { GUIDE_ENRICHMENT } from "./guideEnrichment";
import { GUIDE_DEEP_ENRICHMENT } from "./guideDeepEnrichment";
import { GUIDE_DEEP_ENRICHMENT_2 } from "./guideDeepEnrichment2";
import { GUIDE_DEEP_ENRICHMENT_3 } from "./guideDeepEnrichment3";

const baseGuides: Guide[] = [...GUIDES, ...GUIDES2, ...GUIDES3, ...GUIDES4, ...GUIDES5, ...GUIDES6, ...GUIDES7];

export const ALL_GUIDES: Guide[] = baseGuides
  .map((guide) => {
    const enrichment = GUIDE_ENRICHMENT[guide.slug] ?? [];
    const deepEnrichment = GUIDE_DEEP_ENRICHMENT[guide.slug] ?? [];
    const deepEnrichment2 = GUIDE_DEEP_ENRICHMENT_2[guide.slug] ?? [];
    const deepEnrichment3 = GUIDE_DEEP_ENRICHMENT_3[guide.slug] ?? [];
    if (!enrichment.length && !deepEnrichment.length && !deepEnrichment2.length && !deepEnrichment3.length) return guide;

    const toolbox = guide.blocks.filter((b) => b.t === "toolbox");
    const coreBlocks = guide.blocks.filter((b) => b.t !== "toolbox");

    return {
      ...guide,
      blocks: [...coreBlocks, ...enrichment, ...deepEnrichment, ...deepEnrichment2, ...deepEnrichment3, ...toolbox],
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const allGuideBySlug = new Map(ALL_GUIDES.map((g) => [g.slug, g]));
