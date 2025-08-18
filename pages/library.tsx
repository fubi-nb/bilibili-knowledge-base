import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useVideosStore } from "../store/videos";
import Card from "../components/Card";
import SearchBar from "../components/SearchBar";
import TagFilter from "../components/TagFilter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Library() {
  const router = useRouter();
  const videos = useVideosStore((s) => s.videos);
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((v) => {
      const matchQuery = q === "" || v.title.toLowerCase().includes(q);
      const matchTag = selectedTag === null || v.tags.includes(selectedTag);
      return matchQuery && matchTag;
    });
  }, [videos, query, selectedTag]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">知识库</h1>

      <div className="sticky top-0 bg-background/80 backdrop-blur z-10 pb-2">
        <SearchBar query={query} onQueryChange={setQuery} />
        <TagFilter selectedTag={selectedTag} onSelect={setSelectedTag} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded gradient-border">
                <Skeleton className="h-6 w-2/3 mb-3 animate-shimmer" />
                <Skeleton className="h-4 w-1/2 animate-shimmer" />
              </div>
            ))
          : filtered.map((v) => (
              <div key={v.id} className="gradient-border hover-scale-shadow">
                <Card title={v.title} tags={v.tags} onClick={() => router.push(`/detail/${v.id}`)}>
                  {v.uploader && <div className="text-xs text-muted-foreground">UP 主：{v.uploader}</div>}
                  {v.cover && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.cover} alt={v.title} className="w-full rounded" />
                    </div>
                  )}
                </Card>
              </div>
            ))}
        {!loading && filtered.length === 0 && <div>没有匹配的结果</div>}
      </div>

      <div className="mt-6">
        <Link href="/">返回首页</Link>
      </div>
    </div>
  );
}
