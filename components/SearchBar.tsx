import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  query: string;
  onQueryChange: (q: string) => void;
};

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const [value, setValue] = useState(query);

  useEffect(() => setValue(query), [query]);

  // 300ms 节流
  useEffect(() => {
    const id = setTimeout(() => {
      if (value !== query) onQueryChange(value);
    }, 300);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
      <Input
        placeholder="搜索标题关键字"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-md"
      />
      <Button variant="secondary" onClick={() => onQueryChange(value)}>搜索</Button>
    </div>
  );
} 