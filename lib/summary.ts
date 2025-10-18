import type { Step } from "@/data/videos";

export type Summary = {
  title: string;
  tags: string[];
  materials: string[];
  steps: Step[];
  notes: string[];
};

export function normalizeSummary(data: any): Summary | null {
  try {
    if (!data) return null;
    const obj = typeof data === "string" ? JSON.parse(data) : data;
    if (
      typeof obj.title === "string" &&
      Array.isArray(obj.tags) &&
      Array.isArray(obj.steps) &&
      Array.isArray(obj.notes)
    ) {
      return {
        title: obj.title,
        tags: obj.tags,
        materials: Array.isArray(obj.materials) ? obj.materials : [],
        steps: obj.steps.map((s: any) => ({ time: String(s.time ?? ""), desc: String(s.desc ?? "") })),
        notes: obj.notes.map((n: any) => String(n)),
      };
    }
  } catch {}
  return null;
}

export function createMockSummary(): Summary {
  return {
    title: "AI 摘要 · 示例",
    tags: ["AI 摘要"],
    materials: [],
    steps: [
      { time: "00:05", desc: "提炼主题" },
      { time: "00:18", desc: "列出要点" },
      { time: "00:40", desc: "给出操作步骤" }
    ],
    notes: ["该摘要为占位内容，接入真实 API 后可替换"],
  };
}
