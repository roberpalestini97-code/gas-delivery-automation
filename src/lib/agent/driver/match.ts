import type { DriverAction } from "@/lib/db/schema";
import { parseOrderCode } from "@/lib/utils";

export type MatchedAction = {
  action: DriverAction;
  orderId: number | null;
  minutes?: number;
  note?: string;
  remainderText: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function extractMinutes(text: string): number | undefined {
  const match = text.match(/(?:en\s+)?(\d{1,2})\s*(?:min|mins|minutos)?/i);
  if (match) return Number(match[1]);
  if (/cinco/i.test(text)) return 5;
  if (/diez/i.test(text)) return 10;
  if (/quince/i.test(text)) return 15;
  return undefined;
}

export function matchDriverAction(
  actions: DriverAction[],
  params: {
    text: string;
    interactiveId?: string;
  },
): MatchedAction | null {
  const orderId = parseOrderCode(params.text);
  const remainderText = params.text.replace(/#?G-\d+/i, "").trim();
  const normalized = normalize(remainderText || params.text);

  if (params.interactiveId?.startsWith("action:")) {
    const code = params.interactiveId.replace("action:", "");
    const action = actions.find((a) => a.code === code && a.active);
    if (!action) return null;
    return {
      action,
      orderId,
      minutes: extractMinutes(params.text),
      note: remainderText || undefined,
      remainderText,
    };
  }

  const sorted = [...actions]
    .filter((a) => a.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const action of sorted) {
    if (action.code === "custom_note") continue;
    let aliases: string[] = [];
    try {
      aliases = JSON.parse(action.aliasesJson) as string[];
    } catch {
      aliases = [];
    }
    const haystacks = [action.label, ...aliases].map(normalize);
    if (haystacks.some((alias) => alias && normalized.includes(alias))) {
      return {
        action,
        orderId,
        minutes: extractMinutes(params.text),
        note: remainderText || undefined,
        remainderText,
      };
    }
  }

  // Free-text note only if there's content after an order code or reply context
  const noteAction = sorted.find((a) => a.code === "custom_note");
  if (noteAction && remainderText.length >= 3 && orderId) {
    return {
      action: noteAction,
      orderId,
      note: remainderText,
      remainderText,
    };
  }

  return null;
}