# B 站知识库（Demo 版）

> 把 B 站知识类视频转为结构化笔记的轻量 Demo。输入视频链接，一键生成卡片化要点、步骤清单与备注，形成可反复查阅的个人知识库。

产品名称：B 站知识库（Demo 版）  
版本：V1.0  
日期：2025-08-18

---

## 背景与定位
随着视频平台（尤其是 B 站）的发展，用户越来越依赖视频获取知识与技能，但视频学习常见痛点：
- 内容线性冗长，难以快速定位要点；
- 操作性内容（烹饪/健身/健康）“看过就忘”，复现成本高；
- 现有 AI 摘要工具偏学术/备考，难覆盖生活化知识场景。

本项目定位：将 B 站知识类视频转为结构化、可行动的笔记，帮助节省时间、提升记忆与复现效率。

## 目标用户（简）
- 主要：泛知识类视频学习者（健身、健康、烹饪、数码科普等），希望在需要时快速找到关键信息。
- 次要：在职学习/备考用户（可使用，但竞品较多，本项目更强调生活化与可操作性）。

## 功能特性（MVP）
- 输入 B 站视频链接 → 生成结构化笔记（标题/标签/材料/步骤/备注）。
- 卡片化展示要点，移动端友好，便于“边看边用”。
- 知识库视图：按来源展示，后续将支持标签、搜索与导出。
- 内置 Mock：未配置 AI 也可演示全流程。

## 技术栈
- Next.js 14（Pages 路由） + TypeScript / React 18
- Tailwind CSS + 自定义组件
- Zustand（状态管理）、axios（网络）
- AI：火山引擎 Doubao（Chat Completions，多模态视频理解）

## 目录结构
```
bilibili-knowledge-base/
├─ components/           # 复用 UI 组件
├─ config/               # 配置（AI 等）
├─ data/                 # 示例数据
├─ lib/                  # 辅助库（AI、bilibili 等）
├─ pages/                # Next.js 页面与 API 路由
│  ├─ api/
│  │  ├─ ai-summary.ts   # 服务端代理：B 站字幕抽取 + 结构化摘要 / 视频直链理解
│  │  ├─ bili-info.ts    # 解析 B 站视频基础信息（标题/封面/UP 主）
│  │  └─ bili.ts         # 示例 API（mock）
│  ├─ index.tsx          # 输入视频链接，生成笔记
│  ├─ library.tsx        # 知识库视图
│  └─ detail/[id].tsx    # 详情页
├─ services/             # 前端服务（调用 API 等）
├─ store/                # Zustand 全局状态
├─ styles/               # 全局样式
├─ next.config.js / tsconfig.json / tailwind.config.js
└─ ...
```

## 快速开始
### 环境要求
- Node.js 18+
- 任一包管理器（npm/yarn/pnpm）

### 安装与运行
```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

### 环境变量（.env.local）
```bash
NEXT_PUBLIC_AI_API_KEY=你的火山方舟APIKey
NEXT_PUBLIC_AI_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
NEXT_PUBLIC_AI_MODEL=doubao-1.5-vision-pro-32k
```
说明：未配置 `API_KEY` 或 `API_ENDPOINT` 时，后端 `/api/ai-summary` 会返回示例结果；前端也会在失败时回退占位内容，保证演示可用性。

## AI 接入与“视频理解”注意事项（重要）
- 对于包含 BV 号的 B 站链接，后端 `/api/ai-summary` 会：
  1. 自动抓取视频字幕（优先中文），拼接为长文本；
  2. 调用文本模型生成结构化 JSON 摘要；
  3. 若字幕缺失或模型不可用，回退到内置 Mock。
- 其它可直接访问的 mp4/m3u8 直链仍按 Doubao “视频理解”接口处理：
  - `messages[0].content` 包含 `{ type: "input_video" }` 与 `{ type: "input_text" }`；
  - `response_format: { type: "json_object" }` 强制返回结构化 JSON；
  - 文档参考：[火山引擎 Doubao · 视频理解](https://www.volcengine.com/docs/82379/1362931#%E8%A7%86%E9%A2%91%E7%90%86%E8%A7%A3)。

### 如何处理 B 站链接
1) 直接粘贴 BV 链接即可：后端会尝试字幕抽取与总结。
2) 若该视频没有字幕 / 需要更精细的多模态理解，可考虑：
   - 拉流转存到对象存储，获得可公开访问的直链，再交给多模态模型；
   - 或自行提供字幕文本并调用 `services/ai.ts` 中的 `generateSummary()`。
3) Mock 演示：当 API Key 缺失或调用失败时，依旧返回示例摘要，保障演示流程。

## 关键代码
- AI 配置：`config/aiConfig.ts`
- 服务端视频理解代理：`pages/api/ai-summary.ts`
- 前端调用（视频 URL → 笔记）：`services/ai.ts` 的 `generateSummaryFromVideo()`
- 文本摘要调用：`services/ai.ts` 的 `generateSummary()`
- B 站信息/抽取工具：`services/bilibili.ts`、`lib/bilibili.ts`

## 使用流程（本地）
1. 运行 `npm run dev` 打开首页。
2. 粘贴视频链接：
   - 含 BV 号的 B 站链接会自动抓取字幕并生成摘要；
   - 其它 mp4/m3u8 直链则走“视频理解”多模态流程。
3. 生成后跳转“知识库”查看卡片化笔记，可进入详情页继续查看。

## FAQ（常见问题）
- 为什么个别 B 站链接依旧无法生成？
  - 可能该视频未提供字幕、字幕需要登录才能访问，或返回的是图片类弹幕。此时接口会提示错误。
  - 你可以尝试手动下载字幕并调用 `generateSummary()`，或改用“视频直链”方案。
- 没有 API Key 可以用吗？
  - 可以。本项目内置 Mock 以保证演示。
- 返回 401/429/5xx 怎么办？
  - 401 检查 Key；429 降频或稍后重试；5xx 查看后端日志与响应体。前端 Console 会打印详细错误信息。

## 路线图（Roadmap）
- 多模态扩展：图片理解、图文混排
- 字幕优先流程与稳定抽取
- 知识图谱：跨视频主题关联
- 导出分享：Markdown/PDF
- 更多平台：YouTube、抖音等

## 版权与合规
- 请确保对视频内容具有合法使用与处理授权，严格遵守平台条款与法律法规。
- 若采用“拉流转存”，需特别注意版权合规、用户授权与数据安全。

## 许可
本项目为演示用途，未附带开源许可证；如需商用或二次开发，请先与作者沟通。
