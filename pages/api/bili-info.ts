import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { BILIBILI_HEADERS } from "@/lib/bilibili";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bv } = req.query;
  if (!bv || Array.isArray(bv)) {
    return res.status(400).json({ error: "missing bv" });
  }

  try {
    const resp = await axios.get("https://api.bilibili.com/x/web-interface/view", {
      params: { bvid: bv },
      headers: BILIBILI_HEADERS,
    });

    if (resp.data?.code !== 0 || !resp.data?.data) {
      throw new Error(`unexpected response code: ${resp.data?.code}`);
    }

    const data = resp.data.data;
    return res.status(200).json({
      title: data.title ?? `示例标题 - ${bv}`,
      cover: data.pic ?? "",
      uploader: data.owner?.name ?? "未知UP主",
    });
  } catch (err: any) {
    console.warn("[api/bili-info] proxy failed:", err?.message || err);
    return res.status(200).json({
      title: `示例标题 - ${bv}`,
      cover: "",
      uploader: "示例UP主",
    });
  }
}
