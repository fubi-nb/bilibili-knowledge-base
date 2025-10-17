import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { AI_CONFIG } from "@/config/aiConfig";
import { fetchBilibiliTranscript } from "@/lib/bilibiliTranscript";
import {
  MOCK_SUMMARY,
  isAiServerConfigured,
  summarizeTranscript,
} from "@/lib/aiServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { videoUrl, promptTemplate } = req.body || {};

  if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });
  const isBilibili = /bilibili\.com/i.test(String(videoUrl));

  if (isBilibili) {
    try {
      const transcript = await fetchBilibiliTranscript(videoUrl);

      if (!isAiServerConfigured()) {
        console.warn("[api/ai-summary] AI 配置缺失，返回 mock 摘要");
        return res.status(200).json({
          result: MOCK_SUMMARY,
          meta: { transcriptSource: transcript.source, bv: transcript.bv },
        });
      }

      const summary = await summarizeTranscript({
        transcript: transcript.text,
        promptTemplate,
      });

      return res.status(200).json({
        result: summary,
        meta: { transcriptSource: transcript.source, bv: transcript.bv },
      });
    } catch (error) {
      console.error(
        "[api/ai-summary] B 站字幕或摘要处理失败:",
        (error as Error)?.message || error,
      );
      return res.status(400).json({
        error:
          "暂时无法获取该 B 站视频的字幕或生成摘要，请稍后再试，或提供可直接拉取的视频链接。",
      });
    }
  }
  if (!AI_CONFIG.API_KEY || !AI_CONFIG.API_ENDPOINT)
    return res.status(200).json({
      result: MOCK_SUMMARY,
    });

  const prompt = promptTemplate || `你是视频理解专家。请基于整段视频内容完成如下任务：\n- 提炼视频主题（<=200字）\n- 列出关键标签（3-8个）\n- 给出关键材料或工具（如涉及）\n- 输出步骤要点（数组，每项含 {time, desc}，time 为 00:00 或 mm:ss）\n- 补充注意事项（数组）\n\n请输出严格 JSON，字段为: title, tags, materials, steps, notes；steps 为 {time, desc} 数组。`;

  const payload = {
    model: AI_CONFIG.MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "input_video", video_url: videoUrl },
          { type: "input_text", text: prompt }
        ]
      }
    ],
    max_tokens: 1024,
    temperature: 0.3,
    response_format: { type: "json_object" as const },
    // 如果服务支持 JSON Schema，可在此加上 schema；否则由前端 normalize 解析
  };

  try {
    const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    console.log("[api/ai-summary] response:", resp.data);

    const content = resp.data?.choices?.[0]?.message?.content;
    // 直接返回，前端做 normalize 处理
    return res.status(200).json({ result: content || resp.data });
  } catch (e: any) {
    console.warn("[api/ai-summary] failed:", e?.message || e);
    if (e?.response?.status === 429) {
      return res.status(429).json({ error: "请求频率超限，请稍后重试" });
    }
    if (e?.response?.status === 401) {
      return res.status(401).json({ error: "认证失败，请检查API Key" });
    }
    return res.status(500).json({ error: `处理视频时出错: ${e?.message || "unknown"}` });
  }
}
