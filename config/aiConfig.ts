export const AI_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_AI_API_KEY || "",//Your API KEY
  API_ENDPOINT: process.env.NEXT_PUBLIC_AI_API_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/chat/completions",//For example
  MODEL: process.env.NEXT_PUBLIC_AI_MODEL || "doubao-1.5-vision-pro-32k",//For example
}; 
