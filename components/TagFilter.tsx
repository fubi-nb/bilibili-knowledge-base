import React, { useMemo } from "react";
import { useVideosStore } from "../store/videos";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TagFilterProps = {
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
};

export default function TagFilter({ selectedTag, onSelect }: TagFilterProps) {
  const videos = useVideosStore((s) => s.videos);

  const tags = useMemo(() => {
    const s = new Set<string>();
    videos.forEach((v) => v.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [videos]);

  const current = selectedTag ?? "__all__";

  return (
    <Tabs value={current} onValueChange={(v) => onSelect(v === "__all__" ? null : v)} className="w-full">
      <TabsList className="flex flex-wrap gap-1">
        <TabsTrigger value="__all__">全部</TabsTrigger>
        {tags.map((t) => (
          <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
} 