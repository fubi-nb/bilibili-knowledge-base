import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bv } = req.query;
  if (!bv || Array.isArray(bv)) {
    return res.status(400).json({ error: "missing bv" });
  }

  // TODO: 可在此处代理请求第三方解析服务或自建后端
  // 这里先返回 mock，便于前端演示
  return res.status(200).json({
    title: `示例标题 - ${bv}`,
    cover: "",
    uploader: "示例UP主",
  });
} 