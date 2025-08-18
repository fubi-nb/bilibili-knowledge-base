export type BilibiliInfo = {
  title: string;
  cover: string;
  uploader: string;
};

export function extractBV(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const match = path.match(/BV[\w]+/i);
    return match ? match[0] : null;
  } catch {
    const match = url.match(/BV[\w]+/i);
    return match ? match[0] : null;
  }
}

export async function fetchBilibiliInfo(bv: string): Promise<BilibiliInfo> {
  // 简化：调用公开解析服务或 B 站开放 API 的代理，这里先尝试一个示例 JSON 接口
  // 若失败返回 mock
  try {
    // 这里使用一个不可用的占位符，真实项目应改为你自己的代理 API
    const resp = await fetch(`/api/bili?bv=${encodeURIComponent(bv)}`);
    if (!resp.ok) throw new Error("bad status");
    const data = await resp.json();
    return {
      title: data.title ?? `Bilibili 视频 ${bv}`,
      cover: data.cover ?? "",
      uploader: data.uploader ?? "未知UP主",
    };
  } catch {
    return {
      title: `示例视频 ${bv}`,
      cover: "",
      uploader: "示例UP主",
    };
  }
} 