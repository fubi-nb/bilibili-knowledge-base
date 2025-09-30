import axios from "axios";
import type { Step } from "@/data/videos";

export type Summary = {
  title: string;
  tags: string[];
  materials: string[];
  steps: Step[];
  notes: string[];
};

const MOCK_SUMMARY: Summary = {
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

function normalizeSummary(data: any): Summary | null {
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

// 基于“视频 URL”的火山方舟调用，服务端代理，推荐使用
export async function generateSummaryFromVideo(videoUrl: string, promptTemplate?: string): Promise<Summary> {
  try {
    const resp = await axios.post("/api/ai-summary", {
      videoUrl,
      promptTemplate,
    });
    console.log("[ai] proxy response:", resp.data);

    const parsed = normalizeSummary(resp.data?.result ?? resp.data);
    if (parsed) return parsed;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.warn(
      "[ai] proxy failed, fallback to mock:",
      err?.message || err,
      status ? `(status: ${status})` : "",
      data ? `(data: ${typeof data === "string" ? data : JSON.stringify(data)})` : ""
    );
  }

  return MOCK_SUMMARY;
}

// 纯文本字幕版本的调用（保留以兼容旧流程）；若你更偏好视频理解，请优先使用 generateSummaryFromVideo
export async function generateSummary(videoTranscript: string): Promise<Summary> {
  try {
    const resp = await axios.post("/api/ai-summary", {
      videoTranscript,
    });
    console.log("[ai] transcript proxy response:", resp.data);

    const parsed = normalizeSummary(resp.data?.result ?? resp.data);
    if (parsed) return parsed;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.warn(
      "[ai] transcript proxy failed, fallback to mock:",
      err?.message || err,
      status ? `(status: ${status})` : "",
      data ? `(data: ${typeof data === "string" ? data : JSON.stringify(data)})` : ""
    );
  }

  return MOCK_SUMMARY;
}
