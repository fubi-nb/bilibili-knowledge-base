import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { AI_CONFIG } from "@/config/aiConfig";

const MOCK_SUMMARY = {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { videoUrl, promptTemplate, transcript } = req.body || {};
  const hasVideoUrl = typeof videoUrl === "string" && videoUrl.trim().length > 0;
  const hasTranscript = typeof transcript === "string" && transcript.trim().length > 0;

  if (!hasVideoUrl && !hasTranscript) {
    return res.status(400).json({ error: "Missing videoUrl or transcript" });
  }

  // 火山方舟视频理解需要可直接拉取的视频直链（如 mp4/m3u8），B 站网页链接通常不可直接读取
  if (hasVideoUrl && /bilibili\.com/i.test(String(videoUrl))) {
    return res.status(400).json({
      error:
        "该链接不是视频直链。请提供可直接访问的 mp4/m3u8 链接，或先将视频转存到可公开访问的对象存储后再试。",
    });
  }

  if (!AI_CONFIG.API_KEY || !AI_CONFIG.API_ENDPOINT) {
    return res.status(200).json({ result: MOCK_SUMMARY });
  }

  const headers = {
    Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
    "Content-Type": "application/json",
  };

  if (hasVideoUrl) {
    const prompt =
      promptTemplate ||
      `你是视频理解专家。请基于整段视频内容完成如下任务：\n- 提炼视频主题（<=200字）\n- 列出关键标签（3-8个）\n- 给出关键材料或工具（如涉及）\n- 输出步骤要点（数组，每项含 {time, desc}，time 为 00:00 或 mm:ss）\n- 补充注意事项（数组）\n\n请输出严格 JSON，字段为: title, tags, materials, steps, notes；steps 为 {time, desc} 数组。`;

    const payload = {
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "input_video" as const, video_url: videoUrl },
            { type: "input_text" as const, text: prompt },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
      response_format: { type: "json_object" as const },
    };

    try {
      const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, { headers });
      console.log("[api/ai-summary] response:", resp.data);
      const content = resp.data?.choices?.[0]?.message?.content;
      return res.status(200).json({ result: content || resp.data });
    } catch (e: any) {
      console.warn("[api/ai-summary] failed(video):", e?.message || e);
      if (e?.response?.status === 429) {
        return res.status(429).json({ error: "请求频率超限，请稍后重试" });
      }
      if (e?.response?.status === 401) {
        return res.status(401).json({ error: "认证失败，请检查API Key" });
      }
      return res.status(500).json({ error: `处理视频时出错: ${e?.message || "unknown"}` });
    }
  }

  if (hasTranscript) {
    const payload = {
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: "system" as const,
          content: "你是一个擅长将视频转为步骤化笔记的助手。输出严格的 JSON，字段为: title,tags,materials,steps,notes；steps 为 {time,desc} 数组。",
        },
        {
          role: "user" as const,
          content: `请根据以下字幕生成结构化笔记：\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" as const },
      max_tokens: 1024,
      temperature: 0.3,
    };

    try {
      const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, { headers });
      console.log("[api/ai-summary] response(text):", resp.data);
      const content = resp.data?.choices?.[0]?.message?.content;
      return res.status(200).json({ result: content || resp.data });
    } catch (e: any) {
      console.warn("[api/ai-summary] failed(text):", e?.message || e);
      if (e?.response?.status === 429) {
        return res.status(429).json({ error: "请求频率超限，请稍后重试" });
      }
      if (e?.response?.status === 401) {
        return res.status(401).json({ error: "认证失败，请检查API Key" });
      }
      return res.status(500).json({ error: `处理字幕时出错: ${e?.message || "unknown"}` });
    }
  }

  return res.status(500).json({ error: "未能处理请求" });
}
