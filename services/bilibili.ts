import axios from "axios";
import { extractBV as extractBVFromLib } from "@/lib/bilibili";

export type BiliInfo = { title: string; cover: string; uploader: string };

export const extractBV = extractBVFromLib;

export async function getBilibiliVideoInfo(bv: string | null): Promise<BiliInfo> {
  if (!bv) return { title: "", cover: "", uploader: "" };
  try {
    const resp = await axios.get<BiliInfo>(`/api/bili-info`, { params: { bv } });
    console.log("[bili-info] api response:", resp.data);
    return resp.data;
  } catch (err: any) {
    console.warn("[bili-info] failed, fallback to mock:", err?.message || err);
    return { title: `示例标题 - ${bv}`, cover: "", uploader: "示例UP主" };
  }
}
