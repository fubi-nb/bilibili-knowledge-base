import { create } from "zustand";
import type { Video } from "../data/videos";
import { videos as initialVideos } from "../data/videos";

export type VideosState = {
  videos: Video[];
  addVideo: (video: Video) => void;
  getById: (id: string) => Video | undefined;
  hydrate: () => void;
};

const STORAGE_KEY = "bili_kb_videos";

export const useVideosStore = create<VideosState>((set, get) => ({
  videos: initialVideos,
  addVideo: (video: Video) =>
    set((state) => {
      const next = [video, ...state.videos];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return { videos: next };
    }),
  getById: (id: string) => get().videos.find((v) => v.id === id),
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Video[] = JSON.parse(raw);
        set({ videos: parsed });
      }
    } catch {}
  },
})); 