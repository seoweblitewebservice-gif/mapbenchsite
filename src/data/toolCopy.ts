import { COPY1 } from "./toolCopy1";
import { COPY2 } from "./toolCopy2";
import { COPY3 } from "./toolCopy3";
import { COPY4 } from "./toolCopy4";
import { COPY5 } from "./toolCopy5";
import { COPY6A } from "./toolCopy6a";
import { COPY6B } from "./toolCopy6b";
import { COPY7 } from "./toolCopy7";
import { COPY8 } from "./toolCopy8";
import { COPY9 } from "./toolCopy9";
import { COPY_BATCH } from "./toolCopyBatch";
import { COPY_BULK } from "./toolCopyBulk";
import { GROWTH_COPY } from "./growthCopy";
import { PREMIUM_TOOL_COPY } from "./premiumToolCopy";
import { PREMIUM_TOOL_COPY_2 } from "./premiumToolCopy2";
import { PREMIUM_TOOL_COPY_3 } from "./premiumToolCopy3";
import { PREMIUM_TOOL_COPY_4 } from "./premiumToolCopy4";
import { PREMIUM_TOOL_COPY_5 } from "./premiumToolCopy5";
import { PREMIUM_TOOL_COPY_6 } from "./premiumToolCopy6";
import { PREMIUM_TOOL_COPY_7 } from "./premiumToolCopy7";
import { PREMIUM_TOOL_COPY_8 } from "./premiumToolCopy8";
import { PREMIUM_TOOL_COPY_9 } from "./premiumToolCopy9";
import { PREMIUM_TOOL_COPY_10 } from "./premiumToolCopy10";
import { PREMIUM_TOOL_COPY_11 } from "./premiumToolCopy11";

export interface ToolCopy { h2: string; paras: string[] }

/** Unique on-page content per tool slug — written for usefulness, not keyword stuffing. */
export const TOOL_COPY: Record<string, ToolCopy> = {
  ...COPY1,
  ...COPY2,
  ...COPY3,
  ...COPY4,
  ...COPY5,
  ...COPY6A,
  ...COPY6B,
  ...COPY7,
  ...COPY8,
  ...COPY9,
  ...COPY_BATCH,
  ...COPY_BULK,
  ...GROWTH_COPY,
  ...PREMIUM_TOOL_COPY,
  ...PREMIUM_TOOL_COPY_2,
  ...PREMIUM_TOOL_COPY_3,
  ...PREMIUM_TOOL_COPY_4,
  ...PREMIUM_TOOL_COPY_5,
  ...PREMIUM_TOOL_COPY_6,
  ...PREMIUM_TOOL_COPY_7,
  ...PREMIUM_TOOL_COPY_8,
  ...PREMIUM_TOOL_COPY_9,
  ...PREMIUM_TOOL_COPY_10,
  ...PREMIUM_TOOL_COPY_11,
};