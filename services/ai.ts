import axios from "axios";
import { AI_CONFIG } from "../config/aiConfig";
import { createMockSummary, normalizeSummary, Summary } from "@/lib/summary";

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

  return createMockSummary();
}

// 纯文本字幕版本的调用（保留以兼容旧流程）；若你更偏好视频理解，请优先使用 generateSummaryFromVideo
export async function generateSummary(videoTranscript: string): Promise<Summary> {
  const payload = {
    model: AI_CONFIG.MODEL,
    messages: [
      { role: "system", content: "你是一个擅长将视频转为步骤化笔记的助手。输出严格的 JSON，字段为: title,tags,materials,steps,notes；steps 为 {time,desc} 数组。" },
      { role: "user", content: `请根据以下字幕生成结构化笔记：\n${videoTranscript}` }
    ],
    response_format: { type: "json_object" as const }
  };

  try {
    if (!AI_CONFIG.API_KEY || !AI_CONFIG.API_ENDPOINT) throw new Error("AI 配置缺失，使用 mock");

    const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    console.log("[ai] api response:", resp.data);

    const openAIContent = resp.data?.choices?.[0]?.message?.content;
    const directJson = typeof resp.data === "object" ? resp.data : null;

    let parsed: Summary | null = null;
    parsed = normalizeSummary(openAIContent);
    if (!parsed) parsed = normalizeSummary(directJson);

    if (parsed) return parsed;
  } catch (err: any) {
    console.warn("[ai] failed, fallback to mock:", err?.message || err);
  }

  return createMockSummary();
}
