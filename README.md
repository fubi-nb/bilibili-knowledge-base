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
│  │  ├─ ai-summary.ts   # 服务端代理：视频理解 → 结构化 JSON
│  │  ├─ bili-info.ts    # 解析/mock B 站视频基础信息
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
- 后端 `/api/ai-summary` 遵循 Doubao 的“视频理解”输入：
  - `messages[0].content` 包含：
    - `{ type: "input_video", video_url: <直链> }`
    - `{ type: "input_text", text: <提示词> }`
  - `response_format: { type: "json_object" }` 强制返回结构化 JSON。
- 根据官方文档，“视频理解”需要可直接拉取的媒体直链（mp4/m3u8）。普通 B 站网页链接（bilibili.com/*）不是直链，接口会返回 400 并提示原因。
- 文档参考：[火山引擎 Doubao · 视频理解](https://www.volcengine.com/docs/82379/1362931#%E8%A7%86%E9%A2%91%E7%90%86%E8%A7%A3)

### 如何处理 B 站链接
1) 字幕优先（推荐、稳定）
- 服务端通过 B 站接口获取字幕（需 WBI 签名与鉴权），拼接为 transcript；改走文本摘要（`services/ai.ts` 的 `generateSummary()`）。
- 不在前端暴露签名逻辑与凭证。

2) 服务端拉流转存（需合规评估）
- 服务端拉取 B 站流并合并音视频，上传到对象存储（TOS/S3/OSS）拿到直链，再传给 Doubao。
- 注意版权与平台协议，关注带宽/存储/转码成本与安全。

3) Mock 演示
- 未配置 API 或请求失败时，前后端均回退到示例内容，保证页面可用性。

## 关键代码
- AI 配置：`config/aiConfig.ts`
- 服务端视频理解代理：`pages/api/ai-summary.ts`
- 前端调用（视频 URL → 笔记）：`services/ai.ts` 的 `generateSummaryFromVideo()`
- 文本摘要调用：`services/ai.ts` 的 `generateSummary()`
- B 站信息/抽取工具：`services/bilibili.ts`、`lib/bilibili.ts`

## 使用流程（本地）
1. 运行 `npm run dev` 打开首页。
2. 粘贴视频链接：
   - 若为 mp4/m3u8 直链：直接走“视频理解”。
   - 若为 B 站网页链接：当前会提示非直链（400）。你可以：
     - 走 Mock 演示；
     - 或按“字幕优先/拉流转存”方案改造后端。
3. 生成后跳转“知识库”查看卡片化笔记，可进入详情页继续查看。

## FAQ（常见问题）
- 为什么 B 站链接会报错？
  - 因为“视频理解”需要直链。B 站页面地址通常需要登录、签名与防盗链校验。
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
