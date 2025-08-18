import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { videos as sample } from "../data/videos";
import { useVideosStore } from "../store/videos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractBV, getBilibiliVideoInfo } from "@/services/bilibili";
import { generateSummaryFromVideo } from "@/services/ai";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const addVideo = useVideosStore((s) => s.addVideo);
  const allVideos = useVideosStore((s) => s.videos);

  useEffect(() => {
    let timer: any;
    if (loading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((p) => (p < 100 ? p + 5 : 100));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleGenerate = async () => {
    if (!url || !url.trim()) {
      alert("请先粘贴包含 BV 号的视频链接");
      return;
    }
    setLoading(true);
    const maxId = allVideos.reduce((m, v) => Math.max(m, Number(v.id) || 0), 0);
    const newId = String(maxId + 1);

    const bv = extractBV(url || "");
    const info = await getBilibiliVideoInfo(bv);

    // 基于视频 URL 的摘要（火山方舟代理）
    const summary = await generateSummaryFromVideo(url);

    addVideo({
      id: newId,
      title: summary.title || info.title,
      tags: summary.tags || ["AI 摘要"],
      materials: summary.materials || [],
      steps: summary.steps || [],
      notes: summary.notes || [],
      source: url?.trim() || "",
      cover: info.cover,
      uploader: info.uploader,
    });

    setLoading(false);
    router.push("/library");
  };

  return (
    <div className="min-h-[calc(100vh-60px)] grid place-items-center p-4">
      <div className="w-full max-w-[400px] space-y-4">
        <h1 className="text-2xl font-bold text-center">视频解析页</h1>
        <div className="flex gap-2 max-sm:flex-col">
          <Input
            placeholder="粘贴 B 站视频链接（含 BV 号）"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={loading} className="btn-gradient brand ripple w-full sm:w-auto">
            生成笔记
          </Button>
        </div>
        {loading && (
          <div className="w-full h-2 rounded bg-muted overflow-hidden">
            <div className="h-2 bg-gradient-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <Card className="gradient-border">
          <CardHeader>
            <CardTitle>卡片预览（示例）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>标题：{sample[0].title}</p>
            <p>标签：{sample[0].tags.join("、")}</p>
            <div>
              <strong>步骤示意：</strong>
              <ul className="list-disc pl-5">
                {sample[0].steps.slice(0, 2).map((s) => (
                  <li key={s.time}>[{s.time}] {s.desc}</li>
                ))}
              </ul>
            </div>
            <p>来源：{sample[0].source}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
