import { useRouter } from "next/router";
import Link from "next/link";
import { useVideosStore } from "../../store/videos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Detail() {
  const router = useRouter();
  const { id } = router.query;
  const getById = useVideosStore((s) => s.getById);

  if (!id || Array.isArray(id)) return null;

  const video = getById(id);

  if (!video) {
    return (
      <div className="p-4">
        <p>未找到该条目。</p>
        <Link href="/library">返回知识库</Link>
      </div>
    );
  }

  const jumpToTime = (time: string) => {
    const [mm, ss] = time.split(":" ).map((n) => parseInt(n, 10));
    const seconds = (mm || 0) * 60 + (ss || 0);
    const url = `${video.source}?t=${seconds}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold">{video.title}</h1>
      <p className="text-muted-foreground">标签：{video.tags.join("、")}</p>

      {video.materials && video.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>所需材料/准备</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {video.materials.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>步骤/要点</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {video.steps.map((s) => (
            <div key={s.time} className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => jumpToTime(s.time)}>
                {s.time}
              </Button>
              <span>{s.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {video.notes && video.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>注意事项</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {video.notes.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button asChild>
          <a href={video.source} target="_blank" rel="noreferrer">原视频链接</a>
        </Button>
        <Button variant="outline" disabled>
          导出（预留）
        </Button>
      </div>

      <div>
        <Link href="/library">返回知识库</Link>
      </div>
    </div>
  );
}
