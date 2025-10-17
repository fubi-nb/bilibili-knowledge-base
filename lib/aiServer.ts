import axios from "axios";

export type SummarySteps = { time: string; desc: string };

export type SummaryResult = {
  title: string;
  tags: string[];
  materials: string[];
  steps: SummarySteps[];
  notes: string[];
};

const DEFAULT_PROMPT = `你是视频理解专家。请基于整段视频内容完成如下任务：\n- 提炼视频主题（<=200字）\n- 列出关键标签（3-8个）\n- 给出关键材料或工具（如涉及）\n- 输出步骤要点（数组，每项含 {time, desc}，time 为 00:00 或 mm:ss）\n- 补充注意事项（数组）\n\n请输出严格 JSON，字段为: title, tags, materials, steps, notes；steps 为 {time, desc} 数组。`;

type ServerConfig = {
  endpoint: string;
  apiKey: string;
  model: string;
};

function getServerConfig(): ServerConfig {
  return {
    endpoint:
      process.env.AI_API_ENDPOINT ||
      process.env.NEXT_PUBLIC_AI_API_ENDPOINT ||
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    apiKey: process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || "",
    model: process.env.AI_TEXT_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || "doubao-1.5-pro-32k",
  };
}

export function isAiServerConfigured(): boolean {
  const config = getServerConfig();
  return Boolean(config.apiKey && config.endpoint);
}

function normalizeContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textSegment = content.find((item) => item?.type?.includes("text"));
    if (textSegment?.text) return textSegment.text;
  }
  return "";
}

export async function summarizeTranscript(input: {
  transcript: string;
  promptTemplate?: string;
}): Promise<SummaryResult> {
  const { transcript, promptTemplate } = input;
  const config = getServerConfig();
  if (!config.apiKey || !config.endpoint) {
    throw new Error("AI 配置缺失");
  }

  const prompt = promptTemplate || DEFAULT_PROMPT;
  const textContent = `${prompt}\n\n以下为完整字幕（请基于全文生成结构化摘要）：\n${transcript}`;

  const payload = {
    model: config.model,
    messages: [
      {
        role: "user",
        content: [{ type: "input_text", text: textContent }],
      },
    ],
    max_tokens: 1024,
    temperature: 0.3,
    response_format: { type: "json_object" as const },
  };

  const resp = await axios.post(config.endpoint, payload, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const content = resp.data?.choices?.[0]?.message?.content;
  const text = normalizeContent(content);
  if (!text) {
    throw new Error("模型未返回内容");
  }
  try {
    const parsed = JSON.parse(text);
    return parsed as SummaryResult;
  } catch (error) {
    throw new Error(`模型输出解析失败: ${(error as Error)?.message ?? error}`);
  }
}

export const MOCK_SUMMARY: SummaryResult = {
  title: "AI 摘要 · 示例",
  tags: ["AI 摘要"],
  materials: [],
  steps: [
    { time: "00:05", desc: "提炼主题" },
    { time: "00:18", desc: "列出要点" },
    { time: "00:40", desc: "给出操作步骤" },
  ],
  notes: ["该摘要为占位内容，接入真实 API 后可替换"],
};
