import crypto from "node:crypto";
import { extractBV } from "./bilibili";

export type TranscriptLine = {
  from: number;
  to: number;
  content: string;
};

export type TranscriptResult = {
  source: "live" | "mock";
  bv: string;
  aid?: number;
  cid?: number;
  lines: TranscriptLine[];
  text: string;
};

const MOCK_TRANSCRIPTS: Record<string, TranscriptResult> = {
  BV1xx411c7mD: {
    source: "mock",
    bv: "BV1xx411c7mD",
    lines: [
      { from: 0, to: 4.2, content: "大家好，欢迎来到示例视频，我们将快速了解 B 站字幕摘要流程。" },
      { from: 4.2, to: 10.5, content: "第一步，解析 BV 号并获取字幕数据。" },
      { from: 10.5, to: 18.2, content: "第二步，将字幕文本发送给大模型，让其输出结构化摘要。" },
      { from: 18.2, to: 25.3, content: "最后，展示摘要结果，包括标题、标签、步骤和注意事项。" }
    ],
    text: [
      "大家好，欢迎来到示例视频，我们将快速了解 B 站字幕摘要流程。",
      "第一步，解析 BV 号并获取字幕数据。",
      "第二步，将字幕文本发送给大模型，让其输出结构化摘要。",
      "最后，展示摘要结果，包括标题、标签、步骤和注意事项。"
    ].join("\n")
  }
};

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27,
  43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 41, 13, 37, 48, 7,
  16, 24, 55, 40, 61, 26, 38, 1, 60, 22, 56, 21, 0, 54, 25, 20,
  34, 30, 59, 4, 51, 6, 57, 17, 44, 52, 11, 36
];

let cachedWbi: { mixinKey: string; ts: number } | null = null;

const SAFE_CHAR_REG = /[!'()*]/g;

function normalizeBV(input: string): string {
  const bv = extractBV(input);
  if (!bv) {
    throw new Error(`无法从输入中解析 BV 号: ${input}`);
  }
  return bv;
}

function getMixinKey(orig: string) {
  return MIXIN_KEY_ENC_TAB.map((i) => orig[i]).join("").slice(0, 32);
}

async function getWbiMixinKey(): Promise<string> {
  if (cachedWbi && Date.now() - cachedWbi.ts < 30 * 60 * 1000) {
    return cachedWbi.mixinKey;
  }
  const resp = await fetch("https://api.bilibili.com/x/web-interface/nav");
  if (!resp.ok) {
    throw new Error(`获取 WBI key 失败: ${resp.status}`);
  }
  const json = await resp.json();
  const imgUrl: string | undefined = json?.data?.wbi_img?.img_url;
  const subUrl: string | undefined = json?.data?.wbi_img?.sub_url;
  if (!imgUrl || !subUrl) {
    throw new Error("WBI key 缺失");
  }
  const imgKey = imgUrl.substring(imgUrl.lastIndexOf("/") + 1).split(".")[0];
  const subKey = subUrl.substring(subUrl.lastIndexOf("/") + 1).split(".")[0];
  const mixinKey = getMixinKey(imgKey + subKey);
  cachedWbi = { mixinKey, ts: Date.now() };
  return mixinKey;
}

function encodeParams(params: Record<string, string | number | undefined>) {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .sort();
  const map: Record<string, string> = {};
  for (const key of sorted) {
    const value = String(params[key]);
    map[key] = value.replace(SAFE_CHAR_REG, "");
  }
  return map;
}

async function signWbi(params: Record<string, string | number | undefined>) {
  const mixinKey = await getWbiMixinKey();
  const wts = Math.floor(Date.now() / 1000);
  const encoded = encodeParams({ ...params, wts });
  const searchParams = new URLSearchParams(encoded);
  const query = searchParams.toString();
  const w_rid = crypto.createHash("md5").update(query + mixinKey).digest("hex");
  searchParams.set("w_rid", w_rid);
  searchParams.set("wts", String(wts));
  return searchParams.toString();
}

async function fetchSubtitleList(bv: string, cid: number, aid?: number) {
  const query = await signWbi({ bvid: bv, cid, aid, qn: 16 });
  const resp = await fetch(`https://api.bilibili.com/x/player/wbi/v2?${query}`);
  if (!resp.ok) {
    throw new Error(`获取字幕列表失败: ${resp.status}`);
  }
  const json = await resp.json();
  return json?.data?.subtitle?.subtitles ?? [];
}

async function fetchVideoInfo(bv: string): Promise<{ cid: number; aid?: number }> {
  const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`);
  if (!resp.ok) {
    throw new Error(`获取视频信息失败: ${resp.status}`);
  }
  const json = await resp.json();
  const cid = json?.data?.cid;
  if (!cid) {
    throw new Error("CID 缺失");
  }
  return { cid, aid: json?.data?.aid };
}

async function fetchSubtitleContent(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`拉取字幕内容失败: ${resp.status}`);
  }
  const json = await resp.json();
  return json?.body ?? [];
}

function normalizeLines(body: any[]): TranscriptLine[] {
  return body
    .filter((item) => typeof item?.content === "string")
    .map((item) => ({
      from: Number(item?.from ?? 0),
      to: Number(item?.to ?? 0),
      content: String(item?.content ?? "")
    }))
    .filter((line) => line.content.trim().length > 0);
}

function linesToText(lines: TranscriptLine[]): string {
  return lines.map((line) => line.content.trim()).join("\n");
}

export async function fetchBilibiliTranscript(input: string): Promise<TranscriptResult> {
  const bv = normalizeBV(input);

  try {
    const { cid, aid } = await fetchVideoInfo(bv);
    const subtitles = await fetchSubtitleList(bv, cid, aid);
    const preferred = subtitles.find((item: any) => /简体|中文/i.test(item?.lan_doc ?? "")) || subtitles[0];
    if (!preferred?.subtitle_url) {
      throw new Error("没有可用字幕");
    }
    const subtitleUrl = String(preferred.subtitle_url || "");
    const url = subtitleUrl.startsWith("http") ? subtitleUrl : `https:${subtitleUrl}`;
    const body = await fetchSubtitleContent(url);
    const lines = normalizeLines(body);
    if (!lines.length) {
      throw new Error("字幕为空");
    }
    return {
      source: "live",
      bv,
      cid,
      aid,
      lines,
      text: linesToText(lines)
    };
  } catch (error) {
    console.warn("[bilibiliTranscript] 使用 mock, 原因:", (error as Error)?.message || error);
    const mock = MOCK_TRANSCRIPTS[bv] ?? Object.values(MOCK_TRANSCRIPTS)[0];
    if (!mock) {
      throw error instanceof Error ? error : new Error(String(error));
    }
    return {
      ...mock,
      lines: mock.lines.map((line) => ({ ...line })),
      text: mock.text
    };
  }
}

export function __setWbiCache(value: { mixinKey: string; ts: number } | null) {
  cachedWbi = value;
}
