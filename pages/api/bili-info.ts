import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bv } = req.query;
  if (!bv || Array.isArray(bv)) {
    return res.status(400).json({ error: "missing bv" });
  }

  try {
    // 示例：调用某个可用的解析服务或你自建后端
    // 注意：B 站官方开放 API 需要凭证/签名，这里不直接暴露。建议在服务端完成。
    // const resp = await axios.get(`https://your-proxy.example.com/bili/info`, { params: { bv } });
    // console.log("[api/bili-info] proxy response:", resp.data);
    // return res.status(200).json(resp.data);

    // 暂时返回 mock，并打印日志
    console.log("[api/bili-info] using mock response for bv:", bv);
    return res.status(200).json({
      title: `示例标题 - ${bv}`,
      cover: "",
      uploader: "示例UP主",
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