import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { AI_CONFIG } from "@/config/aiConfig";
import { BILIBILI_HEADERS, extractBV } from "@/lib/bilibili";
import { createMockSummary, normalizeSummary, Summary } from "@/lib/summary";

const DEFAULT_VIDEO_PROMPT = `你是视频理解专家。请基于整段视频内容完成如下任务：\n- 提炼视频主题（<=200字）\n- 列出关键标签（3-8个）\n- 给出关键材料或工具（如涉及）\n- 输出步骤要点（数组，每项含 {time, desc}，time 为 00:00 或 mm:ss）\n- 补充注意事项（数组）\n\n请输出严格 JSON，字段为: title, tags, materials, steps, notes；steps 为 {time, desc} 数组。`;

const SUBTITLE_SYSTEM_PROMPT =
  "你是一个擅长将视频字幕整理为结构化知识卡片的助手。请使用严格的 JSON 输出，字段为 title, tags, materials, steps, notes；steps 为 {time, desc} 数组。";

const MAX_TRANSCRIPT_LENGTH = 12000;

type SubtitleMeta = {
  transcriptLength: number;
  truncatedLength: number;
  bv: string;
  aid?: number;
  cid?: number;
  partTitle?: string;
  subtitleLanguage?: string;
  usedMock: boolean;
};

function buildSubtitlePrompt(transcript: string, promptTemplate?: string): string {
  if (!promptTemplate) {
    return `请根据以下字幕生成结构化笔记：\n${transcript}`;
  }
  if (/\{\{\s*(transcript|content)\s*\}\}/i.test(promptTemplate)) {
    return promptTemplate.replace(/\{\{\s*(transcript|content)\s*\}\}/gi, transcript);
  }
  return `${promptTemplate}\n\n字幕内容：\n${transcript}`;
}

async function fetchBilibiliSubtitle(bv: string) {
  const viewResp = await axios.get("https://api.bilibili.com/x/web-interface/view", {
    params: { bvid: bv },
    headers: BILIBILI_HEADERS,
  });

  if (viewResp.data?.code !== 0 || !viewResp.data?.data) {
    throw new Error(`获取视频信息失败: code=${viewResp.data?.code}`);
  }

  const data = viewResp.data.data;
  const aid = data.aid as number | undefined;
  const pages = Array.isArray(data.pages) ? data.pages : [];
  const firstPage = pages[0];
  const cid = (firstPage?.cid ?? data.cid) as number | undefined;
  if (!cid || !aid) {
    throw new Error("未获取到视频的 cid/aid，可能是付费或限制视频");
  }

  const playerResp = await axios.get("https://api.bilibili.com/x/player/v2", {
    params: { aid, cid, bvid: bv },
    headers: BILIBILI_HEADERS,
  });
  const subtitles: any[] = playerResp.data?.data?.subtitle?.subtitles || [];
  if (!subtitles.length) {
    throw new Error("该视频未提供可下载的字幕");
  }

  const preferred =
    subtitles.find((s) => s.lan === "zh-CN") ||
    subtitles.find((s) => typeof s.lan === "string" && s.lan.toLowerCase().startsWith("zh")) ||
    subtitles[0];

  if (!preferred?.subtitle_url) {
    throw new Error("字幕链接无效");
  }

  const subtitleUrl = preferred.subtitle_url.startsWith("http")
    ? preferred.subtitle_url
    : `https:${preferred.subtitle_url}`;

  const subtitleResp = await axios.get(subtitleUrl, { headers: BILIBILI_HEADERS });
  const body: any[] = Array.isArray(subtitleResp.data?.body) ? subtitleResp.data.body : [];
  if (!body.length) {
    throw new Error("字幕文件为空");
  }

  const contents = body
    .map((item) => (typeof item?.content === "string" ? item.content.trim() : ""))
    .filter(Boolean);
  const transcript = contents.join("\n");

  const truncatedTranscript =
    transcript.length > MAX_TRANSCRIPT_LENGTH
      ? `${transcript.slice(0, MAX_TRANSCRIPT_LENGTH)}\n（字幕过长，后续内容已截断用于摘要生成）`
      : transcript;

  return {
    transcript,
    truncatedTranscript,
    meta: {
      transcriptLength: transcript.length,
      truncatedLength: truncatedTranscript.length,
      bv,
      aid,
      cid,
      partTitle: firstPage?.part ?? data.title,
      subtitleLanguage: preferred?.lan_doc || preferred?.lan,
    },
  };
}

async function summarizeWithSubtitles(transcript: string, promptTemplate?: string): Promise<{ summary: Summary; usedMock: boolean }> {
  const prompt = buildSubtitlePrompt(transcript, promptTemplate);

  if (!AI_CONFIG.API_KEY || !AI_CONFIG.API_ENDPOINT) {
    console.warn("[api/ai-summary] AI 配置缺失，使用 mock 结果");
    return { summary: createMockSummary(), usedMock: true };
  }

  const payload = {
    model: AI_CONFIG.MODEL,
    messages: [
      { role: "system", content: SUBTITLE_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" as const },
  };

  try {
    const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const content = resp.data?.choices?.[0]?.message?.content;
    const parsed = normalizeSummary(content) || normalizeSummary(resp.data);
    if (parsed) {
      return { summary: parsed, usedMock: false };
    }

    throw new Error("模型输出解析失败");
  } catch (err: any) {
    console.warn("[api/ai-summary] 字幕模式调用失败:", err?.message || err);
    return { summary: createMockSummary(), usedMock: true };
  }
}

async function summarizeVideoByUrl(videoUrl: string, promptTemplate?: string): Promise<{ summary: Summary; usedMock: boolean }> {
  if (!AI_CONFIG.API_KEY || !AI_CONFIG.API_ENDPOINT) {
    console.warn("[api/ai-summary] AI 配置缺失，使用 mock 结果");
    return { summary: createMockSummary(), usedMock: true };
  }

  const prompt = promptTemplate || DEFAULT_VIDEO_PROMPT;
  const payload = {
    model: AI_CONFIG.MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "input_video", video_url: videoUrl },
          { type: "input_text", text: prompt },
        ],
      },
    ],
    max_tokens: 1024,
    temperature: 0.3,
    response_format: { type: "json_object" as const },
  };

  try {
    const resp = await axios.post(AI_CONFIG.API_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const content = resp.data?.choices?.[0]?.message?.content;
    const parsed = normalizeSummary(content) || normalizeSummary(resp.data);
    if (parsed) {
      return { summary: parsed, usedMock: false };
    }

    throw new Error("模型输出解析失败");
  } catch (err: any) {
    console.warn("[api/ai-summary] 视频模式调用失败:", err?.message || err);
    return { summary: createMockSummary(), usedMock: true };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { videoUrl, promptTemplate } = req.body || {};

  if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });

  const bv = extractBV(String(videoUrl));

  if (bv) {
    try {
      const { transcript, truncatedTranscript, meta } = await fetchBilibiliSubtitle(bv);
      const { summary, usedMock } = await summarizeWithSubtitles(truncatedTranscript, promptTemplate);
      const subtitleMeta: SubtitleMeta = {
        ...meta,
        usedMock,
      };
      return res.status(200).json({
        result: summary,
        meta: {
          mode: "bilibili-subtitle",
          subtitle: subtitleMeta,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "处理字幕时出错" });
    }
  }

  // 非 B 站视频，保持兼容原有的“直链视频理解”流程
  if (/bilibili\.com/i.test(String(videoUrl))) {
    return res.status(400).json({
      error: "该链接不是视频直链。请提供可直接访问的 mp4/m3u8 链接，或先将视频转存到可公开访问的对象存储后再试。",
    });
  }

  const { summary, usedMock } = await summarizeVideoByUrl(videoUrl, promptTemplate);
  return res.status(200).json({
    result: summary,
    meta: {
      mode: "direct-video",
      usedMock,
    },
  });
}
