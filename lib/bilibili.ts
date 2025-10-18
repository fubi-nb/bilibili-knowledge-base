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

export const BILIBILI_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Referer: "https://www.bilibili.com",
  Origin: "https://www.bilibili.com",
};
