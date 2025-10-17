import assert from "node:assert/strict";
import { fetchBilibiliTranscript } from "../lib/bilibiliTranscript";

async function run() {
  const originalFetch = global.fetch;
  global.fetch = (async () => {
    throw new Error("network disabled in test");
  }) as any;

  try {
    const result = await fetchBilibiliTranscript("https://www.bilibili.com/video/BV1xx411c7mD");
    assert.equal(result.source, "mock");
    assert.ok(result.text.includes("字幕摘要流程"));
    assert.ok(result.lines.length > 0);
    console.log("✅ Bilibili transcript mock fallback works");
  } finally {
    global.fetch = originalFetch;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
