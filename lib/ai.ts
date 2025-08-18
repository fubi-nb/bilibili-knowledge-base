import type { Step, Video } from "@/data/videos";

export function generateFakeNote(input: {
  source: string;
  baseTitle: string;
  tags?: string[];
}): Omit<Video, "id"> {
  const { source, baseTitle, tags = ["AI 摘要"] } = input;
  const keywords = ["入门", "实用", "关键", "避坑", "技巧", "步骤"];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const title = `${baseTitle} · ${pick(keywords)}`;

  const steps: Step[] = [
    { time: "00:05", desc: `${pick(["准备", "开场", "概述"])}阶段内容` },
    { time: "00:18", desc: `${pick(["核心", "重点", "要点"])}梳理` },
    { time: "00:40", desc: `${pick(["演示", "实操", "案例"])}说明` }
  ];

  return {
    title,
    tags,
    materials: [],
    steps,
    notes: ["本条为演示用假摘要，可替换为真实 AI 输出"],
    source,
  };
} 