export type Step = { time: string; desc: string };

export type Video = {
  id: string;
  title: string;
  tags: string[];
  materials?: string[];
  steps: Step[];
  notes?: string[];
  source: string;
  cover?: string;
  uploader?: string;
};

export const videos: Video[] = [
  {
    id: "1",
    title: "番茄炒蛋教程",
    tags: ["烹饪"],
    materials: ["鸡蛋3个", "番茄2个", "葱花少许"],
    steps: [
      { time: "00:12", desc: "切番茄" },
      { time: "00:25", desc: "打蛋" },
      { time: "00:43", desc: "热锅冷油" }
    ],
    notes: ["番茄要去皮"],
    source: "https://www.bilibili.com/video/example"
  },
  {
    id: "2",
    title: "胃酸过多科普",
    tags: ["健康科普"],
    steps: [
      { time: "00:05", desc: "症状表现" },
      { time: "00:18", desc: "缓解食物" },
      { time: "00:40", desc: "避免食物" }
    ],
    notes: ["持续不适需就医"],
    source: "https://www.bilibili.com/video/example2"
  }
];
