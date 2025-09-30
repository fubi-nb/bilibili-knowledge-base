export const AI_CONFIG = {
  API_KEY: process.env.AI_API_KEY || "",
  API_ENDPOINT:
    process.env.AI_API_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  MODEL: process.env.AI_MODEL || "doubao-1.5-vision-pro-32k",
};
