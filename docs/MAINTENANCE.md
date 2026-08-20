# StyleForge 项目维护文档

> **项目**: `D:\mywebsites\StyleForge`
> **技术栈**: React 19 + TypeScript + Vite（前端）+ Vercel Functions / Supabase（云端 API）
> **用途**: 云端 AI 照片风格转换工具（Img2Img · Cloud），无浏览器本地模型
> **本文件**: 记录本项目架构、关键决策与变更日志。每次改动后更新「变更日志」。

---

## 一、项目架构

### 1.1 技术要点

| 模块 | 说明 |
|------|------|
| `src/lib/imageUtils.ts` | 上传图片加载、等比缩放（cloud 路径 1024）、PNG 下载 |
| `src/lib/generate/client.ts` | 云端转换 API 客户端（`/api/transform`），按可用 provider 出图 |
| `src/i18n/en.ts` | 全部界面文案（当前仅英文） |
| `src/pages/HomePage.tsx` | 主流程：上传 → 选云端风格 → transformImage → 对比/下载 |
| `src/pages/SeoPage.tsx` | SEO 落地页（4 个 slug，BrowserRouter 路由） |
| `api/` | Vercel Functions：`transform.ts`（风格转换）、`styles.ts`（目录）、`models.ts`（Create Style 模型列表）、`health.ts` |
| `public/styles/api/` | 云端风格示例图（`/styles/api/*.png`） |

### 1.2 关键约定

- **纯云端推理**: 所有风格转换走 `POST /api/transform`（provider：replicate / dashscope / mock），浏览器不加载任何模型
- **风格目录**: `src/shared/styles-catalog.ts`（纯数据）→ `api/_shared/styleCatalog.ts` 仓库接口；社区投稿存 Supabase
- **单一 Feature**: `Feature = 'api'`，无 Local/Browser 模式；历史遗留的 `engine: 'local'` 相关代码已全部移除

---

## 二、变更日志

### 2026-08-17 — Generations 计费 + Style 生态闭环 + 顶部导航重构

**背景**：按下一阶段任务建立完整产品闭环：Generations 计费（不按 Style 收费）、Lemon Squeezy 支付（二期启用）、Style 全量迁库、前端顶部导航重构。**用户决策**：样式全量迁数据库；先核心闭环（计费+Style+前端重构），LS 代码完整实现但 env 占位。

**数据库**（新增 `0003_billing.sql` / `0004_styles.sql` / `0005_storage.sql`）：
- `credit_balances` + `credit_transactions` + `generations` + 原子 RPC（spend/refund/grant）+ 新用户引导 trigger（+10 Generations）+ `subscriptions` 扩展
- `styles` 主表（官方 6 样式 seed + 社区 approved），**无客户端 RLS**（Prompt 只服务端读）；`saved_styles`；**drop `user_styles` 公开读策略**（堵 Prompt 直读漏洞）
- `generations` 私有存储桶

**后端**：
- 新 `_shared/auth.ts`（getUserId 抽取）/ `pricing.ts`（唯一计费配置）/ `permissions.ts`（can* 层）/ `billing.ts`（预扣→生成→确认/退款事务）
- `transform.ts`：**认证 + 计费**（402 余额不足、失败退款）+ 移除 `X-Generate-Prompt` 泄露头
- `styles.ts` GET 改读 DB + search/category/sort；新 `style-review.ts`（批准写 styles + slug）、`my-styles.ts`、`account.ts`（余额+流水+权限）、`pricing.ts`、`generations.ts`（signed URL）、`saved-styles.ts`
- **Lemon Squeezy**（二期启用，代码就位）：`ls.ts`（HMAC 验签）、`checkout.ts`、`ls-webhook.ts`（订阅事件 + 幂等发额）

**前端**：
- **取消左侧 Sidebar → 顶部导航**：`SiteHeader`（纯文字 StyleForge logo + Explore/Styles/Create/Pricing + ⚡ Generations + plan 徽章 + Avatar 菜单）+ `AppLayout`；删除 `AppSidebar.tsx`
- 纯白背景 `#FFFFFF`；新 `/pricing`、`/account` 页；`ToolPage` 登录门禁 + "1 Generation" 提示 + 402 提示；**StyleDetail 移除 Show/Copy Prompt**；Explore 用真实 usage/like；My Creations 改数据库（删 localStorage `creations.ts`）；收藏（saved-styles）
- 共享类型 `account-types.ts`/`pricing-types.ts`；hooks `useAccount`/`usePricing`；`lib/api.ts` authedFetch

**验证**：tsc + oxlint + vite build 全绿；CDP 实测——纯白背景、顶部导航无 Sidebar、Pricing 三档卡片、Tool 未登录门禁、StyleDetail 无 Prompt 元素、logo 纯文字。**待用户执行**：在 Supabase 跑 3 个迁移 + 配 env（LS keys、STYLE_ADMIN_EMAILS）后，端到端计费/闭环才可用。

---

### 2026-08-17 — PromptHero-inspired 信息架构重构（黑白 UI）

**背景**：将 StyleForge 从 "AI SaaS 工具页" 重构为图片优先的内容发现平台（搜索 + 高密度 Gallery + Style 详情 + 个人创作）。**不改任何 API / Supabase / 认证 / 图片生成逻辑**。颜色按要求改为**纯黑白灰**（去掉强调色）。

**信息架构 / 路由**（`src/App.tsx`）：
- `/` → **Home**（内容发现：紧凑标题 + 大搜索 + Featured/Trending/New 三段画廊）
- `/tool` → Image to Image（原 HomePage 迁移改名 ToolPage，支持 `?style=` 预选）
- `/explore` → 搜索 + 分类 + **排序**（Popular/Trending/Newest）高密度画廊
- `/styles/:id` → **StyleDetail**（新：大图 + 元数据 + Prompt 展开/复制 + Related）
- `/create` → Create Style（保留）
- `/creations` → **My Creations**（新：localStorage 生成历史 + 下载/重试/删除）
- `/blog`、SEO slug 保留；`/home` 重定向 `/`

**组件**：
- 新增 `TopNav`（分类快速浏览条）、`SortDropdown`（排序）、`PromptBlock` 并入 StyleDetail
- 改造 `StyleCard`：Image-first 紧凑卡片，likes/uses 徽章（`src/lib/mockEngagement.ts` 确定性伪数据，无后端）、hover "Use Style"
- `AppSidebar` 重构：全路由 Link 导航 + My Creations + 紧凑化
- 删除死代码：`LandingPage.tsx`、`studio/Sidebar.tsx`、`studio/StyleSampleCard.tsx`

**数据层**：`src/lib/creations.ts`（localStorage 生成记录，因无数据库表）

**视觉**（黑白）：`--brand` 系改为近黑/浅灰；全部渐变改纯色；Hero 缩小（token 44px max）；grid 更密（minmax 180px）；Sidebar/卡片紧凑化；高密度留白

**验证**：tsc + oxlint + vite build 全绿；CDP 实测——Home 三段画廊 + 搜索跳转 `/explore?q=sci` 过滤 1 张、Detail Prompt 展开/复制、sidebar 6 项、移动端 2 列 + 搜索纵向堆叠、body `#F7F5F0`。

---

### 2026-08-17 — 色彩系统换肤：粉色 → 暖色中性（Terracotta）

**背景**：按新色板替换全站颜色，粉色品牌体系改为暖色中性系。

**新色板**：
- 背景 `#F7F5F0`（body/sidebar/header）、主文字 `#242321`、次文字 `#706D67`、按钮 `#242321` + 白字 `#FFFFFF`、强调色 `#B65F4A`、Active `#EAE6DE`、边框 `#DEDAD2`

**改动**（`src/index.css`，只改 tokens，不改结构）：
- `:root` 全量换色：pink scale 改成 terracotta 棕红 scale（`--pink-500: #b65f4a` 等）、`--brand*` 语义别名映射新强调色、`--text/text-secondary/text-muted` 新中性色、`--bg` 新增背景变量、`--btn-*` 新增按钮变量（深色按钮 + 白字）
- `body` 背景 `var(--bg)`、`.app-sidebar`/`.header` 跟随 `#F7F5F0`、`.dropzone` 改白底以在米白背景上突出
- `.btn-primary` 用 `--btn-bg`（深色按钮）替代原粉色按钮；`.btn-ghost` hover 用新 brand-soft

**验证**：tsc + vite build 全绿；CDP 实测——body 背景 `rgb(247,245,240)`、主文字 `rgb(36,35,33)`、按钮 `rgb(36,35,33)` + 白字、强调渐变 `rgb(182,95,74)→rgb(138,66,48)`、active 导航 `rgb(234,230,222)`、卡片白底 + 边框 `rgb(222,218,210)`、无默认阴影。

---

### 2026-08-17 — 前端 UI/UX 全面重设计（AI Creative Platform）

**背景**：将 StyleForge 从"工具页"重设计为现代、明亮、图片优先的 AI Style Platform。**不改业务逻辑**（API/Supabase/认证/图片生成/路由全部保留），只重设计前端视觉与布局。

**Design System**（`src/index.css` 全量重写，~1400 行）：
- 统一 Design Tokens：品牌粉 `--brand`（复用现有 pink 体系）、语义化中性色/边框/阴影/圆角/间距/排版 scale、`--sidebar-w` 布局变量
- 白底、hairline 浅粉边框、16px 圆角、无默认阴影、品牌粉强调、hover 动画 180ms 克制

**新增组件**：
- `StyleCard.tsx`（统一样式卡片：预览图 + 名称 + 分类 + hover "Use Style" + 选中态 + compact 变体）
- `StyleGrid.tsx`（响应式网格）、`SearchBar.tsx`（搜索输入）、`CategoryTabs.tsx`（分类筛选 pills）

**页面重构**：
- **Home (`/home`)**：Hero（大标题 + 品牌粉 accent + 双 CTA）+ "A style for every mood" StyleCard 画廊
- **Image to Image (`/`)**：三步骤纵向流程（① Upload ② Choose a style ③ Transform），StyleCard 网格替代原右侧 Sidebar 选择器，busy 时保留页面稳定
- **Explore (`/explore`)**：搜索框（前端过滤）+ 分类 Tabs + StyleCard 画廊 + 空状态
- **Create Style (`/create`)**：左右两栏（左表单 + 右 sticky 预览/提交），复用模型卡片选择
- **Blog (`/blog`)**：改造成 Journal 风格（封面图 + 分类 + 标题 + 摘要 + 日期卡片），统一使用全局 Sidebar
- **Sidebar**：固定 240px、白底、浅粉边框、active 浅粉高亮、底部 Blog/Auth 固定

**响应式**：≤900px sidebar 变顶部横向条（沿用现有方案并美化）；grid 桌面 3-4 列 / 平板 3 列 / 移动 2 列

**验证**：`tsc -b` + `oxlint` + `vite build` 全绿；CDP 无头实测——Home/Explore/Create/Blog/SEO 各页 DOM 结构、Hero 字号 54px、StyleCard 圆角 16px/无默认阴影、active 导航浅粉、hover overlay 出现 + 卡片上移 + 图片放大、上传后预览 + Transform 按钮启用、搜索过滤、移动端 sidebar 横向 + grid 2 列。

---

### 2026-08-17 — Create Style 模型选择：修复 env 不热更新 + 卡片式美化

**背景**：Create Style 的模型下拉不随后端 `REPLICATE_MODELS` 更新（dev 需重启才生效），且原生 `<select>` 样式朴素。

**根因**：`vite.config.ts` 的 serveApi 用 `loadEnv('development', cwd, '')`（空前缀）加载 env——Vite 的 loadEnv 会把 `process.env` 读回覆盖解析结果，而 reloadEnv 又用 loadEnv 更新 process.env，形成鸡生蛋，process.env 永远冻结在首次加载值。

**修复**：
- `vite.config.ts`：serveApi 改为每次 `/api` 请求直接 `parseEnv()`（node:util）解析 `.env` → `.env.local` 并写入 `process.env`，改 env 立即生效、无需重启 dev server
- `src/pages/CreateStylePage.tsx`：模型选择由原生 `<select>` 改为卡片式单选（`model-card` 按钮组，显示 `label` + 完整 `model id` 小字，数据仍来自 `/api/models`）；`REPLICATE_MODELS` 为空时显示提示而非空白；seed 字段改 full width 对齐布局
- `src/index.css`：新增 `.model-grid` / `.model-card` / `.model-empty`（选中态粉色高亮）；`@media (max-width:640px)` 下网格单列

**验证**：tsc -b + vite build + oxlint 全绿；实测 dev 运行中修改 `.env.local` 的 `REPLICATE_MODELS`，`/api/models` 立即返回新列表、恢复后立即还原；CDP 打开 `/create` 确认侧边栏 "Image to Image"、页面无 console 错误。

---

### 2026-08-17 — Image to Image UI 调整：改名 + 操作按钮常驻 + 原图预览

**背景**：Cloud-only 后统一 Image to Image 交互——导航去掉 "Cloud" 后缀改为完整名；生成按钮不再等上传后才出现，而是常驻底部；上传后用户可看到自己的原图大预览。

**改动**：
- `src/i18n/en.ts`：`featureApi` 改为 "Image to Image"，`featureApiHint` 改为 "AI style transfer"
- `src/components/studio/AppSidebar.tsx`：导航 title 改为 "Image to Image"
- `src/pages/HomePage.tsx`：studio-tool 重构——上传后显示 `photo-preview` 大图预览（data URL）+ 文件名/尺寸 + 替换按钮；底部新增常驻 `.studio-actions` 操作栏（生成按钮未上传或 busy 时禁用，已上传可点；done 态由 ResultCompare 自带按钮接管）
- `src/index.css`：新增 `.photo-preview*`（预览图容器/大图/元信息行）与 `.studio-actions`（`margin-top: auto` 沉底）+ 按钮 disabled 态

**验证**：tsc -b + vite build 全绿；CDP 无头实测——初始态上传区 + 底部生成按钮（禁用）常驻；模拟上传后大图预览渲染、按钮变为可点、文件名/尺寸正确、导航显示 "Image to Image"。

---

### 2026-08-17 — 移除浏览器本地模型功能，仅保留云端 API

**背景**：按需求完全删除浏览器端本地 ONNX 推理（AnimeGANv2 / onnxruntime-web）及 Local 模式，产品只剩「Img2Img · Cloud」单一云端路径。

**改动（功能删除）**：
- 删除 `src/lib/animeOnnx.ts`（onnxruntime-web 推理封装）、`src/lib/preprocess.ts`、`src/lib/postprocess.ts`；新建 `src/lib/imageUtils.ts`（上传加载/缩放/PNG 下载）
- `src/shared/styles-catalog.ts`：删除 hayao/shinkai/paprika 三个 `engine: 'local'` 样式（仅保留 cloud 样式）
- `src/shared/style-types.ts`：`StyleEngine` 收窄为 `'cloud'`；删除 `StyleDefinition.model` 字段（local-only）
- `src/shared/styles.ts`：`Feature` 收窄为 `'api'`；删除死代码 `featureToMode`
- `src/pages/HomePage.tsx`：删除本地推理分支（processLocal/getSession/runAnime/tensor 管线），只留 uploadBlob → transformImage 云端路径；去掉 `feature` 状态与 `?feature=` URL 参数
- `src/components/studio/AppSidebar.tsx`：删除「Img2Img — Local」导航，移除 `feature` prop
- `src/components/studio/Sidebar.tsx`：移除 `feature` prop，hint 固定为 cloud
- `src/pages/LandingPage.tsx` / `ExplorePage.tsx` / `CreateStylePage.tsx`：删除 Local/On-device 卡片、local engine 筛选、`feature=` 跳转参数
- 删除静态资源：`public/models/*.onnx`（3 个模型）、`public/ort/`（WASM）、`public/styles/local/`；`scripts/generate.mjs`（本地 ONNX 推理测试脚本）
- `package.json`：移除 `onnxruntime-web` 依赖；`vite.config.ts`：删除 serve-ort-loaders 插件

**改动（文案/SEO 同步）**：`index.html` meta/OG、`src/i18n/en.ts`（featureBrowser/browserMode/browserStyle* 删除，homeHeroPoints/howStepHints/privacyItems/seo 等改为云端语义）、`src/pages/SeoPage.tsx`/`BlogPage.tsx` 落地页文案、Header 默认 pill 改为 cloud。

**验证**：`tsc -b` + `vite build` 全绿；dist 不再包含 onnxruntime WASM/模型。

---

### 2026-08-17 — 模型列表改为环境变量配置（/api/models）

**背景**：Create Style 表单的预设模型列表原硬编码在 `replicate-models.ts`，改为环境变量配置。

**改动**：
- 删除 `src/shared/replicate-models.ts`
- 新建 `api/models.ts`：`GET /api/models` 返回 `REPLICATE_MODELS` env（JSON 数组 `[{id,label}]`），解析失败返回空列表不崩溃
- `src/pages/CreateStylePage.tsx`：改为 fetch `/api/models` 加载模型下拉（local 定义 `ReplicateModelOption` 类型）
- `vercel.json`：注册 `api/models.ts`
- `.env.example`：加 `REPLICATE_MODELS` JSON 数组示例

**验证**：tsc -b + oxlint + vite build 全绿。

---

### 2026-08-17 — Create Style 功能：前端表单 + 可复用保存接口 + 后端投稿入库

**背景**：用户自建 style 的入口。用户输入 prompt、选 model（预设列表）、上传样例图，保存成自己的 style（pending 待审核）。核心交付一个可复用 `saveStyle()` 接口，未来「生成图片后点保存 style」可直接复用。

**决策**：model 只预设列表；投稿走后端 `POST /api/styles`（服务端 JWT 验证 + Supabase service_role 写库）。

**新建文件**：
- `src/shared/replicate-models.ts`：`REPLICATE_MODELS` 预设模型列表（占位，待替换实际模型）
- `src/lib/styles/saveStyle.ts`：可复用 `saveStyle(input)`——上传样例图到 Storage → POST /api/styles，`sampleImage` 接受 `File | Blob`（未来传生成结果的 Blob 即可复用）
- `src/pages/CreateStylePage.tsx`：表单页（label/description/category/prompt/model/seed/样例图上传 + 预览），未登录显示提示
- `api/_shared/supabase.ts`：服务端 admin client（`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`）
- `supabase/migrations/0002_style_submission.sql`：`user_styles` 加 `model`/`seed` 列 + `style-samples` Storage bucket（public 读、authenticated 传）

**修改文件**：
- `src/shared/style-types.ts`：`StyleSubmission`/`CommunityStyleRecord` 加 `model`/`seed`；`communityToStyle()` 组装 `providerOverrides.replicate`
- `api/_shared/styleCatalog.ts`：实现 `createDbCommunityStyleRepository()`（create/listByUser/review，service_role 绕过 RLS）+ 导出单例
- `api/styles.ts`：加 POST handler——Bearer token → `auth.getUser` 验证 → 校验字段 → `communityStyleRepository.create`
- `src/App.tsx`：加 `/create` 路由
- `src/components/studio/AppSidebar.tsx`：加「Create Style」导航（加号图标）+ active 判断排除 isCreate
- `src/i18n/en.ts`：`create.*` 文案段
- `src/index.css`：`.create-*` 表单样式（12px 圆角对齐全局）
- `.env.example`：加 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（服务端专用）

**验证**：tsc -b + oxlint + vite build 全绿。

**待用户完成**：跑 0002 迁移；`.env.local` 加 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`；替换 `REPLICATE_MODELS` 为实际模型。

---

### 2026-08-17 — 新增 Replicate provider（图生图模型平台）

**背景**：接入 replicate.com 的图生图 API。Replicate 是模型平台（每个模型 input schema 不同），故设计为可配置：模型/图片字段名/prompt 字段名/额外参数都可通过 `providerOverrides.replicate` 或环境变量指定。

**改动文件**：
- `src/shared/generate-types.ts`：`PROVIDER_IDS` 加 `'replicate'`
- `src/shared/style-types.ts`：新增 `ReplicateStyleOverrides`（model/version/imageKey/promptKey/input），`ProviderStyleOverrides extends ReplicateStyleOverrides`
- `api/providers/replicate.ts`（新）：Replicate provider——异步 prediction 模式（`POST /v1/predictions` 创建 → `GET /v1/predictions/{id}` 轮询 → 下载 output），`Authorization: Bearer` 认证，图片转 data URI（base64）传入，output 支持 URL 字符串/数组/`{url}`/data URI
- `api/_shared/registry.ts`：注册 `replicate` provider
- `.env.example`：加 `REPLICATE_API_TOKEN` + 可选 `REPLICATE_MODEL`（"owner/name" 或 "owner/name:version"）/ `REPLICATE_MODEL_VERSION`（版本 hash）

**使用方式**：
- 环境变量设 `REPLICATE_API_TOKEN`（必须）+ `REPLICATE_MODEL` 或 `REPLICATE_MODEL_VERSION`（默认模型）
- 某 style 专属配置：在 `styles-catalog.ts` 该 style 的 `providerOverrides` 加 `replicate: { model: "...", imageKey: "...", promptKey: "...", input: {...} }`
- 调用：`POST /api/transform?styleId=X&provider=replicate`

**注意**：Replicate 冷启动可能超 55s（Vercel Hobby 上限），慢模型建议 Pro 或调 `GENERATE_TIMEOUT_MS`。

**验证**：tsc -b + oxlint + vite build 全绿。

---

### 2026-08-16 — Google 登录（Supabase Auth，占位框架）

**背景**：接入 Supabase Auth 实现 Google 登录。本期搭好完整代码框架，用环境变量占位，等用户建好 Supabase 项目填 key 即可用。

**新增文件**：
- `src/lib/supabase.ts`：惰性 client 单例，读 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`，未配置时导出 `null`
- `src/hooks/useAuth.ts`：`useAuth()` hook——`getSession()` 恢复会话 + `onAuthStateChange` 监听 + `signInWithGoogle()`（`signInWithOAuth`，redirectTo 回 origin）+ `signOut()`
- `src/components/AuthButton.tsx`：登录按钮（未登录显示 Google 图标 + "Sign in with Google"；已登录显示头像/首字母 + 姓名，点击退出）

**修改文件**：
- `src/components/studio/AppSidebar.tsx`：底部 `app-nav--foot` 里 Blog 下方接入 `<AuthButton collapsed={collapsed} />`
- `src/index.css`：新增 `.auth-btn`/`.auth-google-icon`/`.auth-avatar`/`.auth-avatar--fallback`/`.auth-label` 样式（8px 圆角对齐全局风格）；折叠时按钮居中只显图标
- `.env.example`：新增 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 占位
- `package.json`：新增依赖 `@supabase/supabase-js`

**行为**：未配置 Supabase 环境变量时，`supabase` 为 null，登录按钮整体隐藏（不渲染无效按钮）；配置后显示登录/退出。

**待用户完成（接真实项目）**：
1. 在 https://supabase.com 建项目，取 Settings → API 的 Project URL + anon public key，填入 `.env.local`
2. Supabase → Authentication → Providers → Google 开启，填 Google Cloud OAuth client ID/secret
3. 添加重定向 URL（本地 http://localhost:5173 和线上 https://styleforge.org）
4. 运行 `supabase/migrations/0001_style_ecosystem.sql`（建 profiles/user_styles/subscriptions 表）

**验证**：oxlint + tsc -b + vite build 全绿。

---

### 2026-08-16 — 预留用户自建 Style（社区投稿）：数据库 schema + 仓储接口

**背景**：为登录/注册 + 付款 + 用户自建 style 做预留。本期只建 schema 和接口，不接 Supabase SDK、不实现投稿端点。

**新建文件**：
- `supabase/migrations/0001_style_ecosystem.sql`：`profiles`（扩展 auth.users）、`user_styles`（社区投稿 style，含 slug/category/prompt/tags/status/review_note）、`subscriptions`（付费 gating 预留）+ `set_updated_at()` 触发器 + RLS（已批准公开可读、用户仅管自己的投稿）

**修改文件**：
- `src/shared/style-types.ts`：新增 `StyleReviewStatus`（pending/approved/rejected）、`StyleSubmission`（投稿载荷）、`CommunityStyleRecord`（DB 形态）+ `communityToStyle()`（审核通过转 StyleDefinition，注入 engine='cloud'/source='community'/tier='free'/status='active'）
- `api/_shared/styleCatalog.ts`：新增 `CommunityStyleRepository` 接口（create/listByUser/review）+ 未来聚合点注释（`styleCatalog.list()` 未来合并 official + 已批准 community）
- `api/styles.ts`：顶部注释标明未来投稿端点（POST /api/styles、PATCH /api/styles/:id/review、GET /api/styles/mine）

**关键判断**：社区投稿 style 一定是 `engine='cloud'`（本质是「提示词 + 样例图」，走 API 转换），不可能是 local（ONNX 需本地模型文件）。故 engine 无需存储，审核时注入。

**验证**：tsc -b + vite build 全绿；现有 /api/styles 返回 9 官方 style 无回归。

---

### 2026-08-16 — Sidebar 扁平化 + 域名/品牌迁移到 StyleForge

**一、Sidebar 扁平化**（`src/index.css`）：
- `.app-nav-item` 圆角 12px → 8px（对齐全局小圆角风格）
- `.app-nav-text strong` 字重 800 → 600（DM Sans 下更轻盈）

**二、域名/品牌迁移**（AnimeMe → StyleForge，anime-me.vercel.app → styleforge.org）：
- `src/i18n/en.ts`：`appName` AnimeMe → StyleForge
- `src/components/studio/AppSidebar.tsx`、`src/components/Header.tsx`：logo 图标字母 A → S
- `public/favicon.svg`：favicon 文字 A → S
- `index.html`：canonical / og:url / og:image / twitter:image / JSON-LD url 全部 → styleforge.org；title / og:title / og:site_name / twitter:title / JSON-LD name 全部 AnimeMe → StyleForge
- `public/sitemap.xml`、`public/robots.txt`：域名 → styleforge.org

**验证**：tsc -b + vite build 通过。

---

### 2026-08-16 — 前端风格扁平化：小圆角 + 中性灰边框（参考 imageprompt.org）

**背景**：参考 https://imageprompt.org/ 的视觉风格，将网站从「大圆角 + 粉色边框 + 明显阴影」的可爱圆润风，改为「小圆角 + 中性灰边框 + 极轻阴影」的扁平化专业风。颜色主色保持粉色（品牌色不变）。

**设计 tokens（`src/index.css` `:root`）**：
- `--line` 边框色：`#f2e2e9`（粉）→ `#e2e8f0`（中性灰，对齐 imageprompt `--colors-border`）
- `--radius`：22px → **12px**；`--radius-sm`：14px → **8px**
- 阴影减弱且改中性灰：`--shadow-sm` 0 1px 2px / `--shadow` 0 1px 3px / `--shadow-lg` 0 4px 12px（原来粉色 14/36/48px 大阴影）

**组件圆角减小**（大圆框 → 小圆框）：
- 卡片/容器：`.studio` 24→12、`.studio-tool` 18→12、`.privacy-section` 24→12、`.landing-feature-card` 20→12、`.blog-card` 18→12、`.compare` 18→12、`.dropzone` 20→12、`.drop-icon` 20→12、`.file-info` 16→10、`.explore-card` 16→10、`.landing-style-item` 16→8、`.style-sample-card` 14→8
- 图标/缩略图：`.logo-mark` 14→8、`.landing-feature-icon` 16→8、`.file-thumb` 12→8、`.style-sample-img` 10→6、`.explore-card-img` 11→8
- 按钮（pill → 8px 圆角）：`.btn-primary/.btn-ghost`、`.nav-link`、`.explore-filter-btn`、`.dropzone-compact`
- 边框加粗值收敛：`2px/2.5px` → `1px`（卡片/按钮），`.dropzone` 2.5px dashed → 1.5px dashed

**保留**：粉色主色（按钮/图标渐变/hover）、徽章类 pill（`.privacy-pill`/`.style-group-count`/`.explore-card-badge`/`.hero-points li`/`.compare-label`/`.slider-handle`/`.preset-check`）——这些是标签/徽章，非「框」。

**验证**：vite build 通过。

---

### 2026-08-16 — 收起键改为 panel-left 图标（参考 vheer.com）

**背景**：分析 vheer.com 的侧边栏收起键——`data-slot="sidebar-trigger"` 按钮，lucide `panel-left` 图标（`<rect width=18 height=18 x=3 y=3 rx=2/><path d="M9 3v18"/>`），ghost 图标按钮风格（size-7 28px、rounded-md、hover:bg-accent）。

**改动文件**：
- `src/components/studio/AppSidebar.tsx`：toggle 图标从条件切换的 `‹`/`›` 箭头改为静态 `panel-left` 图标（圆角矩形 + 左侧竖线分割，两态同一图标）
- `src/index.css`：`.app-sidebar-toggle` 从高瘦「耳朵」标签（48px 高、半圆右圆角、左无边框）改为干净圆角方块按钮（28×28、`border-radius: 8px`、四边细边框、白底、hover 变 `--pink-50`）；位置移到顶部 `top: 18px`（与 logo 对齐），仍在右边缘外 `right: -14px`

---

### 2026-08-16 — 背景改纯白（去掉粉色径向渐变）

**改动文件**：`src/index.css` — `body` 背景从双径向渐变（粉色光晕）+ 纯白底，改为纯 `#ffffff`；移除 `background-attachment: fixed`。

---

### 2026-08-16 — 字体更换为 DM Sans（参考 imageprompt.org）

**背景**：参考 https://imageprompt.org/ 的排版，将全站字体从 Fredoka（标题）+ Nunito（正文）更换为 DM Sans，并参考其字号层级。

**改动文件**：
- `index.html`：Google Fonts 加载从 `Fredoka + Nunito` 改为 `DM+Sans:opsz,wght@9..40,400..800`（可变字重）
- `src/index.css`：
  - `--font-display` / `--font-body` 均改为 `'DM Sans'`（单一家族，标题靠字重区分）
  - 字号上调（DM Sans 字面较 Fredoka/Nunito 紧凑，放大补偿）：`.hero-h1` 40→48px、`.landing-hero .hero-h1` 44→48px、`.app-hero .hero-h1` 32→36px、`.studio-title` 26→30px；移动端 hero 34→38px
  - 标题字重 600→700（`.hero-h1`/`.studio-title`/`.logo`），更接近参考站的专业感；`.logo` 字号 19→18px

**验证**：vite build 通过；全站标题/正文统一为 DM Sans，hero 标题 48px 与参考站（3rem）对齐。

---

### 2026-08-16 — Style 生态：统一 Style 模型 + 后端目录服务

**背景**：把散落在 4 处的 style 定义（本地 ONNX tuple / 云端 presets / 不对称 i18n / 重复的 label 解析）封装成可高度扩展的统一模型，后端按「未来 style 生态」设计（本地文件存储 + 预留数据库接口）。

**新增文件**：
- `src/shared/style-types.ts`：统一 `StyleDefinition` 契约（engine/category/tier/source/status/labelKey/descriptionKey/sampleImage/tags/order/author/prompt/providerOverrides/model）+ `DashscopeFunction`/`MockFilter`/`ProviderStyleOverrides` + `StyleCatalogResponse`/`PublicStyleDefinition`
- `src/shared/styles-catalog.ts`：`STYLE_CATALOG` 纯数据数组（9 风格，补齐 category/tier/source/tags/order，provider 专属参数移入 `providerOverrides`）+ `CATEGORY_PRESETS`（分类展示顺序）
- `api/_shared/styleCatalog.ts`：`StyleCatalog` 仓储接口 + `createLocalStyleCatalog()` 本地实现 + 单例（未来 `createDbStyleCatalog()` 读数据库，实现同一接口即可）
- `api/styles.ts`：`GET /api/styles`（可选 `?category=&engine=&tier=`），对 cloud style **剔除 `prompt`** 再返回
- `src/lib/styles/client.ts`：`fetchStyles()`（模块级缓存 + Promise 去重）
- `src/hooks/useStyles.ts`：加载目录的 React hook

**修改文件**：
- `src/shared/styles.ts`：改为 UI 辅助——保留 `Feature`/`featureToMode`（现返回 engine），新增 `resolveStyleMeta()`（统一 label/description 解析）
- `src/lib/animeOnnx.ts`：移除 `STYLES` tuple，`getSession(model)` 按模型文件名加载
- `src/i18n/en.ts`：合并 `en.styles` 与 `en.apiStyles` 为单一 `styles: { [id]: { label, description } }`
- `api/_shared/provider.ts`：`TransformImageOptions.preset` → `style: StyleDefinition`
- `api/transform.ts`：`getStylePreset` → `styleCatalog.get()`；校验 `engine==='cloud'` 且有 `prompt`
- `api/providers/{openai,seedream,dashscope,mock}.ts`：改读 `opts.style.prompt` / `opts.style.providerOverrides.*`
- `src/components/studio/{StyleSampleCard,Sidebar}.tsx`、`src/pages/{HomePage,ExplorePage,LandingPage}.tsx`：改用 `useStyles`/`resolveStyleMeta`；Sidebar 按 category 分组；ExplorePage 按 category + engine 筛选
- `vercel.json`：注册 `api/styles.ts`

**删除文件**：`src/shared/presets.ts`（数据迁入 styles-catalog.ts，类型迁入 style-types.ts）

**设计决策**：prompt 只在后端（目录端点剔除，前端只存 styleId）；分类是数据不是枚举；provider 专属参数走 `providerOverrides`；前端走 HTTP 而非静态 import（换 DB 对前端不可见）；付费/投稿字段（tier/source/author/status）本期只建 schema，上传/支付流程留作后续。

**验证**：tsc -b / oxlint / vite build 全绿；`GET /api/styles` 返回 9 style + 4 分类且 cloud style 无 `prompt`；本地/云端转换路径用 `styleCatalog.get()` 解析。

---

### 2026-08-16 — 侧边栏 UI 微调：删除 Tools 标签、toggle 改为右边缘「耳朵」标签

**改动**：
- `src/components/studio/AppSidebar.tsx`：
  - 删除 `<span className="app-nav-label">{en.appNavTools}</span>`（导航区"Tools"标题文字）
  - toggle 按钮移出 `app-sidebar-top`，改为直接放在 `<aside>` 内，贴右边缘绝对定位
  - 图标改为方向箭头：展开时显示左箭头 `‹`，收起时显示右箭头 `›`
  - 新增 `app-sidebar-inner` 包裹内容区（承接原来的 padding/gap/overflow-y）
- `src/index.css`：
  - `.app-sidebar`：`overflow: visible`，去掉 padding/gap（移入 inner）
  - `.app-sidebar-inner`：flex 列布局 + padding + overflow-y
  - `.app-sidebar-toggle`：`position: absolute; top: 50%; right: -13px`，高 48px 宽 26px，右侧圆角（0 10px 10px 0），左边无 border，形成贴边「耳朵」标签效果；两种状态下位置完全一致
  - 移除 `.app-sidebar--collapsed .app-sidebar-toggle` 单独覆盖（统一样式）

**效果**：toggle 始终悬浮在侧边栏右边缘中央，展开/收起只变图标方向，视觉自然一致。

---

### 2026-08-16 — 侧边栏可收起 + Home/Blog 导航 + SEO 改善（claude-seo）

**背景**：用户要求工具页左侧边栏可收起、加 Home 导航（导主界面）和 Blog 导航；并安装 claude-seo skills 改善搜索流量。

**一、侧边栏改造**：
- `src/components/studio/AppSidebar.tsx`：新增**折叠按钮**（收起/展开，受控 `collapsed` state）；导航项含 **Home**（→ /home）、Browser Loading、API Style Transfer、**Blog**（→ /blog）；折叠时只显示图标 + title tooltip
- `src/pages/HomePage.tsx`：管理 `collapsed` state，传给 AppSidebar；`app-main` 加 `app-main--collapsed` class 联动 margin
- `src/pages/BlogPage.tsx`（新）：Blog 落地页（3 篇指南卡片占位），带顶部导航
- `src/index.css`：`.app-sidebar--collapsed`（64px 窄栏图标模式）、`.app-sidebar-toggle`、`.app-nav--foot`、`.app-main--collapsed`；移动端折叠按钮隐藏、sidebar 还原顶部横条
- `src/i18n/en.ts`：新增 `appNavHome/Hint`、`appNavBlog/Hint`、`blog.*`

**二、安装 claude-seo（SEO 技能）**：
- 克隆 https://github.com/AgriciDaniel/claude-seo 到 `~/.claude/plugins/marketplaces/agricidaniel-claude-seo`，注册到 `known_marketplaces.json`
- 25 个 seo-* skills 装入 `~/.claude/skills/`、18 个 agents 装入 `~/.claude/agents/`（本次会话已生效，`/seo` 命令可用）

**三、SEO 改善**：
- `index.html`：补充 canonical、Open Graph（og:title/description/image）、Twitter card、**JSON-LD 结构化数据**（WebApplication + Offer + AggregateRating）
- `public/robots.txt`（新）：允许爬取、禁止 /api、指向 sitemap
- `public/sitemap.xml`（新）：7 个 URL（home/工具/4 SEO slug/blog）带优先级
- `src/pages/{SeoPage,BlogPage,LandingPage,HomePage}.tsx`：动态设置 `document.title`（每页独立标题，SPA 下利于 SEO）

**验证**：侧边栏 250→64px 收起、主内容 margin 联动；4 导航项（Home/Browser/API/Blog）跳转正确；/blog 标题正确；dist 含 robots.txt/sitemap.xml + JSON-LD；移动端折叠按钮隐藏；tsc/lint/build 全绿。

---

### 2026-08-16 — 新增网站主界面 /home（介绍 + 功能展示）

**背景**：用户要求点击 logo 能看到网站主界面，主界面做成网站介绍 + 功能展示。`/` 保留工具界面，新增 `/home` 作为主界面。

**改动文件**：
- `src/pages/LandingPage.tsx`（新）：主界面——顶部导航（logo/Features/Styles 锚点/隐私）+ Hero 介绍 + 两个功能卡片（Browser Loading / API Style Transfer，点击进入对应工具）+ 9 种风格预览网格
- `src/App.tsx`：新增 `/home` 路由（LandingPage）
- `src/components/studio/AppSidebar.tsx`：logo 链接指向 `/home`
- `src/pages/HomePage.tsx`：用 `useSearchParams` 读取 `?feature=`（browser/api），从主界面功能卡片进入时自动激活对应功能
- `src/i18n/en.ts`：新增 `landingNavFeatures`/`landingNavStyles`/`landingFeaturesTitle/Subtitle`/`landingStylesTitle/Subtitle`
- `src/index.css`：`.landing-*` 系列样式（hero/features/styles 网格）；移动端折叠

**验证**：/home 主界面 Hero + 2 功能卡片 + 9 风格预览；点 API 卡片 → `/?feature=api` 自动激活 API（6 云端风格）；点 logo → 回 /home；tsc/lint/build 全绿。

---

### 2026-08-16 — 布局模仿 vheer.com：左侧固定边栏 + 两个独立功能入口

**背景**：用户要求前端布局模仿 vheer.com（通过本机 7890 代理访问分析），颜色风格不变（保持粉色主题）。核心变化：导航功能移到**左侧固定边栏**，并把"浏览器加载"与"API 风格转换"分成**两个独立功能入口**。

**改动文件**：
- `src/components/studio/AppSidebar.tsx`（新）：左侧固定边栏——顶部 logo + 功能菜单（Browser Loading / API Style Transfer 两个入口）+ 底部隐私标记
- `src/components/studio/Sidebar.tsx`：改为按 feature 显示对应风格组（Browser→本地 3，API→云端 6），不再同时显示两组
- `src/pages/HomePage.tsx`：重构为 `.page--app` 布局（左 sidebar + 右 app-main）；新增 `feature` state（browser/api），点击边栏入口切换；移除单页滚动模块（锚点），Hero 精简为右侧顶部描述；移除顶部 Header/footer
- `src/shared/styles.ts`：新增 `Feature` 类型 + `featureToMode()`
- `src/i18n/en.ts`：新增 `appNavTools`/`featureBrowser`/`featureBrowserHint`/`featureApi`/`featureApiHint`
- `src/index.css`：`.page--app` 左右布局、`.app-sidebar`（fixed 250px 左侧边栏）、`.app-nav`/`.app-nav-item`（两个功能入口）、`.app-main`/`.app-hero`；清理单页模块死 CSS（section/hero-grid/styles-gallery/how-steps 等）；移动端（≤900px）边栏折叠为顶部横条

**验证**：左侧边栏 logo + 2 功能入口 + 隐私；Browser 激活显示 3 本地风格→上传→本地推理→对比；切换 API 显示 6 云端风格→transform→对比；两个功能完全独立；移动端边栏折叠；tsc/lint/build 全绿。

---

### 2026-08-16 — 移除 AI 生图（文生图）功能，保留图片风格转换

**背景**：用户要求去掉 AI 生图功能。删除文生图（text-to-image）全链路，**保留**图生图/风格转换（/api/transform）。

**删除文件**：
- `src/pages/GeneratePage.tsx`、`src/components/generate/`（PresetPromptSelector/GenerateResult/CloudPrivacyNote）
- `api/generate.ts`（POST /api/generate 文生图端点）

**修改文件**：
- `src/App.tsx`：移除 `/generate` 路由
- `src/components/Header.tsx`：移除 AI Generate 导航链接（保留 Converter/Styles/How it works 锚点）
- `api/_shared/provider.ts`：`ImageProvider` 移除 `generate()`，仅保留 `transform?`；移除 `GenerateImageOptions`/`SizeRatio`
- `api/providers/{openai,dashscope,seedream,mock}.ts`：移除 `generate()` 实现（保留 `transform()`）
- `src/shared/generate-types.ts`：移除 `GenerateRequest`/`SIZE_RATIOS`/`SizeRatio`/`MAX_COUNT`
- `src/shared/presets.ts`：移除 `PRESET_PROMPTS`/`getPreset`（文生图预设），保留 `STYLE_TRANSFER_PRESETS`
- `src/lib/generate/client.ts`：移除 `generateImage`；`format.ts` 精简为仅 `blobToCanvas`
- `src/i18n/en.ts`：移除 `generate.*` 文案段（保留 `apiStyles`）
- `src/index.css`：清理文生图遗留 CSS（mode-switch/mode-option/preset-grid/preset-card/size-pills/generate-result/provider-chip/cloud-note/旧 style-card 等）
- `vercel.json`：移除 api/generate.ts functions 配置
- `.env.example`：移除 ARK_MODEL（文生图模型）注释

**验证**：首页 Hero + 3 锚点导航；无 AI Generate 链接；/generate 回落到首页；API 风格转换（选 Sci-Fi→transform→对比）正常；tsc/lint/build 全绿。

---

### 2026-08-16 — 首页改为单页滚动多模块（锚点导航 + 各模块分区）

**背景**：用户要求网站在同一页展示多个模块，可上下滑动浏览，也可点击顶部导航栏锚点直达目标位置；图片上传模块与右侧风格选择作为同一个模块（两栏高度对齐）；第一模块为文字介绍 + 图片展示。

**改动文件**：
- `src/pages/HomePage.tsx`：重构为单页多模块结构
  - **Module 1 Hero**：左侧文字介绍（标题/副标题/卖点/CTA "Start converting"）+ 右侧风格样例图展示（4 张：hayao/sci-fi/shinkai/watercolor）
  - **Module 2 Converter**：两栏一体工具（左上传/结果 + 右风格面板）作为带背景的整体模块
  - **Module 3 Styles**：9 种风格画廊（点击选中并平滑滚动回工具区）
  - **Module 4 How it works**：4 步流程
  - Privacy 区保留
- `src/components/Header.tsx`：导航改为**锚点链接**（Converter / Styles / How it works），首页用 `#id`、其他页用 `/#id`；保留 AI Generate 链接
- `src/i18n/en.ts`：新增 `navConverter/navStyles/navHow`、`homeHeroCta`、`stylesSectionTitle/Subtitle`、`howSectionTitle/Steps/Hints`
- `src/index.css`：`html { scroll-behavior: smooth }`；`.section { scroll-margin-top: 76px }`（锚点跳转不被 sticky header 遮挡）；模块分区样式（`.hero-grid/.hero-visual/.styles-gallery/.style-card/.how-steps/.how-step`）；converter 两栏 `align-items: stretch` 等高一体

**验证**：5 个 section 模块结构正确；Hero 标题 + 4 样例图；导航 3 锚点点击平滑滚动（scrollY 1493）；Converter 两栏等高（720=720）且上传在左；Styles 9 卡片、How 4 步；移动端 hero-grid 单列、how-steps 折叠；tsc/lint/build 全绿。

---

### 2026-08-16 — 右侧风格面板分类化 + 自动路由 + 页首 Hero 描述

**背景**：模仿 imagetocartoon.com，右侧风格面板改为分类展示，本地与云端风格同时可见；页面上方添加本土化英文描述（定位：帮助用户将图片转化为科幻/动漫风等风格的 AI 网站）。

**改动文件**：
- `src/components/studio/Sidebar.tsx`：改为分组渲染——**On-device styles（本地 3 风格）+ Cloud styles（云端 6 风格）** 两个分组同时展示，每组标题 + 数量徽标 + 提示
- `src/components/studio/ModeSwitch.tsx`：删除（不再需要 Browser/API 手动切换）
- `src/pages/HomePage.tsx`：移除 `mode` state 与 `switchMode`；新增 `hero--home` 描述区（大标题 + 副标题 + 3 个卖点）；**按选中风格 kind 自动路由**——本地风格走 ONNX 推理、云端风格走 `/api/transform`
- `src/i18n/en.ts`：新增 `homeHeroTitle/Accent/Subtitle/Points`（本土化英文，如 "Turn any photo into a whole new style."，强调 sci-fi/anime/oil painting/sketch/watercolor 多风格）
- `src/index.css`：`.style-group` 分组样式（标题/数量徽标/分隔线）、`.hero--home` 居左描述区样式

**验证**：右侧分组 On-device(3)+Cloud(6) 共 9 卡片；Hero 区正常显示；自动路由——选 Hayao 走本地 ONNX、选 Sci-Fi 走 API transform，均出对比结果；tsc/lint/build 全绿。

---

### 2026-08-15 — 布局靠齐 imagetocartoon.com（左上传 + 右风格面板，颜色不变）

**背景**：用户通过本机 7890 代理访问 https://imagetocartoon.com/，要求按其前端格式调整。确认约束：**只对齐布局结构，颜色保持现有粉色主题不变**。

**目标站布局特征（已分析）**：工具区为左右两栏——左侧上传/结果（flex-1 大画布）+ 右侧固定宽度（320-384px）风格选择面板（模型下拉 + 方形样例图卡片网格 + hover scale）。

**改动文件**：
- `src/pages/HomePage.tsx`：工具区两栏**方向反转**——上传/结果区（studio-main）移到左侧，风格选择面板（Sidebar）移到右侧
- `src/index.css`：`.studio` grid 从 `320px 1fr` 改为 `1fr 340px`（左宽右窄）；风格卡片网格改为 `auto-fill minmax(110px,1fr)`、样例图 `aspect-ratio: 1/1`（方形）+ `object-fit: cover`、hover 从 translateY 改为 `scale(1.05)`；移除未用的 `.studio-brand` 样式
- 颜色系统（粉色 tokens、白色背景、粉色 CTA）**保持不变**

**验证**：桌面上传区左 144-928px / 风格面板右 956-1296px（固定 340px）；方形样例图 cover 裁剪显示；上传→本地推理→结果、API 模式 6 风格、模式切换全通过；移动端单列（上传顶部、风格面板下方）；tsc/lint/build 全绿。

---

### 2026-08-15 — 排版样式模仿 Fotor（恢复顶部导航 + 工作台视觉精化）

**背景**：用户要求前端排版模仿 www.fotor.com。确认决策：恢复顶部导航栏、保持双栏工作台形态、保持粉色主题（仅模仿排版，不换色）。

**改动文件**：
- `src/components/Header.tsx`：重构为 Fotor 风格顶部导航——左 logo、中功能菜单（Studio / AI Generate / Tools，NavLink 高亮当前页）、右隐私标记（private/cloud 变体保留）
- `src/components/studio/Sidebar.tsx`：移除品牌标识（已移入顶部导航），顶部直接是风格区标题
- `src/pages/HomePage.tsx`：重新引入 `<Header />`（位于 studio 上方）
- `src/index.css`：header-inner 加宽到 1200px 居中、nav 链接 pill 高亮态；studio-tool 改为浅灰画布背景 `#faf7f9`（Fotor 画布工作台感）、白色内容面板叠于其上
- `src/i18n/en.ts`：新增 `navHome`（'Studio'）

**验证**：桌面双栏工作台（顶部导航 3 链接 + 左样式栏 + 右浅灰画布）、上传→本地推理→结果、移动端单列折叠，全通过零错误；tsc/lint/build 全绿。

---

### 2026-08-15 — 桌面双栏布局（Studio）+ 图生图风格转换 API

**背景**：图片处理站定位，首页改为桌面双栏：左侧样式栏（品牌+风格卡片样例图+文字）、右侧上传/结果区、右侧下方 Browser/API 模式切换。API 模式是**图生图/风格转换**（上传照片→调第三方 API→转风格），非文生图。

**新增文件**：
- `api/transform.ts`：POST /api/transform（图生图，裸二进制 body + query 传 styleId/provider/quality，规避 4.5MB）
- `api/_shared/image.ts`：魔数嗅探 MIME 校验
- `src/shared/styles.ts`：统一本地+API 风格清单（StyleOption / stylesForMode / Mode）
- `src/components/studio/`：`Sidebar.tsx`、`StyleSampleCard.tsx`（样例图+文字+选中对勾）、`ModeSwitch.tsx`（Browser/API 分段控件）
- `public/styles/local/`：3 张本地风格样例图（由 scripts/generate.mjs 从测试图生成）
- `public/styles/api/`：6 张 API 风格占位样例图（sharp 滤镜生成，后续可换真实 provider 输出）

**修改文件**：
- `api/_shared/provider.ts`：ImageProvider 加可选 `transform?(opts)` + TransformImageOptions
- `api/_shared/http.ts`：新增 `readBinaryBody`；ImagePayload 加 styleId→X-Generate-Style header
- `api/providers/{openai,dashscope,seedream,mock}.ts`：各加 `transform()`（OpenAI edits / 通义万相 imageedit 异步 / 即梦 seededit / mock 用 sharp 本地滤镜）
- `src/shared/presets.ts`：新增 `STYLE_TRANSFER_PRESETS`（6 风格：anime/sci-fi/hk/oil-painting/sketch/watercolor，含 prompt/dashscopeFunction/mockFilter）+ `getStylePreset`
- `src/shared/generate-types.ts`：`StyleTransformRequest`
- `src/pages/HomePage.tsx`：重写为 `.studio` 双栏 + mode 状态机（本地 ONNX / API transform 双路径，切风格/切模式自动重跑）
- `src/lib/generate/client.ts`：`transformImage`；`format.ts`：`blobToCanvas`
- `src/components/ResultCompare.tsx`：`resultLabel` prop（API 模式显示风格名）
- `src/i18n/en.ts`：studio 文案 + `apiStyles`
- `src/index.css`：`.studio` 双栏（320px+1fr）、sidebar sticky、样例卡片、mode-switch、900px 折叠单列
- `src/components/StyleSelector.tsx`：删除（被 Sidebar 替代）
- `vercel.json`：登记 api/transform.ts
- `package.json`：正式加入 `sharp`（mock provider 依赖）
- `.env.example`：`ARK_EDIT_MODEL` 注释

**验证**：桌面双栏（左栏样例图加载/本地 Hayao→对比/切 API 6 风格→mock transform→对比）全通过；移动端 390px 折叠单列；/generate 与 SEO 页无回归；tsc/lint/build 全绿。

---

### 2026-08-15 — 首页改为全屏沉浸式布局 + 移除顶部功能导航

**改动文件**：
- `src/pages/HomePage.tsx`：移除 hero 大标题/副标题/卖点列表，用户进入网站直接看到上传区；tool-card 用 `home-tool` 类透明化融入背景
- `src/components/Header.tsx`：移除 nav 功能链接（Tools / AI Generate），只保留 logo + 隐私 pill（该组件仍支持 `pill` prop，generate 页用 cloud 变体）
- `src/index.css`：新增 `.home-main`/`.home-tool` 全屏沉浸式样式（main 撑满视口垂直居中、idle dropzone 放大为 46vh 中央主体、图标 84px）；移动端适配

**行为变化**：首页首屏即上传框（无导航、无大标题），风格选择/结果对比等交互在 dropzone 下方自然展开；/generate 页保留原布局（hero + pill）；SEO 落地页不受影响。

**验证**：桌面/移动端全屏渲染正常；上传→推理→对比→下载全流程无回归（tsc/lint/build 全绿）。

---

### 2026-08-15 — 扩展为图片处理站：AI 生图功能 + Vercel Functions 后端

**背景**：从纯前端照片转动漫站扩展为图片处理站。本期新增 AI 生图（text-to-image），采用系统预设提示词（前端不提交自由 prompt，后端按 presetId 解析权威 prompt）。部署平台 Vercel，用 Vercel Functions（api/*.ts）做后端代理隐藏 API key。架构为后续 AI 抠图/扩图预留扩展点。

**新增文件**：
- `api/`：Vercel Functions
  - `generate.ts`（POST /api/generate 生图）、`health.ts`（GET /api/health provider 配置状态）
  - `providers/`：`openai.ts`（gpt-image-1）、`dashscope.ts`（通义万相异步+轮询）、`seedream.ts`（火山方舟即梦）、`mock.ts`（本地占位，无 key 开发用，也作参考实现）
  - `_shared/`：`provider.ts`（ImageProvider 接口+尺寸归一化）、`registry.ts`（注册表+getProvider）、`http.ts`、`errors.ts`（结构化错误码）
- `src/shared/`：`generate-types.ts`（前后端共享契约）、`presets.ts`（系统预设提示词单一事实来源）
- `src/pages/GeneratePage.tsx`（/generate 路由页）
- `src/components/generate/`：`PresetPromptSelector.tsx`、`GenerateResult.tsx`、`CloudPrivacyNote.tsx`
- `src/lib/generate/`：`client.ts`（fetch 客户端，二进制图+元数据 header）、`format.ts`
- `tsconfig.api.json`、`vercel.json`、`.env.example`

**修改文件**：
- `src/App.tsx`：新增 `/generate` 路由
- `src/components/Header.tsx`：pill 变体 prop（private/cloud）+ AI Generate 导航链接
- `src/components/ProcessingOverlay.tsx`：label prop
- `src/i18n/en.ts`：`generate.*` 文案段（含预设 label/description、错误文案）
- `src/index.css`：生图页样式（preset-grid、size-pills、generate-result、cloud pill 变体）
- `vite.config.ts`：`serveApi()` dev 中间件（ssrLoadModule 直接跑 api/*.ts，零 Vercel 登录）
- `.gitignore`：忽略 `.env`/`.env.*`

**关键设计**：
- 响应**二进制图片直返**（Vercel 4.5MB 上限，base64 会超）；元数据走 `X-Generate-*` header
- 多提供商：`IMAGE_PROVIDER` 默认 + provider 注册表；OpenAI 恒返回 base64（函数内解码）、DashScope 异步轮询后函数内下载、Seedream b64_json
- 前端从 `/api/health` 探测可用 provider，优先真实 provider，无则用 mock
- 隐私区分：本地转动漫「100% Private」文案不变；/generate 用 Cloud-powered pill + CloudPrivacyNote
- Vercel functions `maxDuration: 60`（Hobby 上限），SPA catch-all rewrite（filesystem 先匹配不吞 /api）

**验证**：mock provider 全链路（选预设→生成→展示→下载）通过；400 错误（非法 presetId/size）通过；HomePage/SEO 文案未变、深链正常；tsc/lint/build 全绿。

**部署注意**：Dashboard 设 `OPENAI_API_KEY`/`DASHSCOPE_API_KEY`/`ARK_API_KEY`/`IMAGE_PROVIDER`；慢 provider（DashScope 异步）在 Hobby 有 60s 撞墙风险，建议 Pro 或开 Fluid Compute。本地开发 `IMAGE_PROVIDER=mock` 无需 key。

---

### 2026-08-15 — 修复输出图片只有一条线（输出张量宽高解读错误）

**问题**：推理完成后前端/下载图片只有中间一条竖线。

**根因**：`src/lib/animeOnnx.ts` 中 `runAnime()` 从输出 dims 取宽高时写成了 `width = dims[length-1]`、`height = dims[length-2]`。但模型输出为 NHWC `[1, H, W, 3]`，导致 width 取到通道数 3、height 取到 W——canvas 被创建为 3px 宽 × W 高的条状。

**修复**（`src/lib/animeOnnx.ts`）：按 NHWC 布局改为 `width = dims[2]`、`height = dims[1]`。

**验证**：320×240 输入 → 输出 320×240，色彩丰富（2439 色）正常，AnimeGAN 风格着色正确。

---

### 2026-08-15 — 修复模型加载失败（jsep.mjs 404）+ 上传后显示文件名

**问题1：点击 Anime 显示"无法加载模型"**。根因：onnxruntime-web 运行时通过动态 `import('/ort/ort-wasm-simd-threaded.jsep.mjs?import')` 加载 WASM 加载器，而 Vite 8 dev server 对 `/public` 目录文件的 `?import` 请求返回 500（public 文件不允许被 module import）。生产构建不受影响，仅 dev 模式报错。

**修复**：
- `vite.config.ts`：新增 `serveOrtLoaders()` 插件，dev 模式对 `/ort/*.mjs` 请求直接返回 `public/ort/` 原始文件，绕开 Vite transform
- `public/ort/`：补全缺失的 `.mjs` 加载器文件（`ort-wasm-simd-threaded.{mjs,asyncify.mjs,jsep.mjs,jspi.mjs}`），之前只复制了 `.wasm`
- `.oxlintrc.json`：`ignorePatterns` 忽略 `public/ort/**`（第三方 .mjs 噪音）

**问题2：上传图片后前端无反应，无文件名显示**。

**修复**：
- `src/pages/HomePage.tsx`：新增 `fileName` state；上传后 tool-card 顶部显示「加载文件条」（缩略图标 + 文件名 + 尺寸 `W × H px`），供确认已选图片
- `src/components/UploadDropzone.tsx`：新增 `compact` 属性，加载文件条右侧显示紧凑的「Replace photo」按钮（支持点击/拖拽/粘贴/键盘）
- `src/i18n/en.ts`：新增 `replaceHint`

**行为变化**：上传成功即可见文件名与处理尺寸；点击 Replace photo 可换图。

---

### 2026-08-15 — 前端重构为粉色+白色主题（ui-ux-pro-max 规范）+ 交互补全

**改动文件**：
- `src/index.css`：整体重构为粉色+白色设计 tokens（`--pink-50…800`）、白色渐变背景 + 粉色径向光晕、Fredoka/Nunito 字体配对、Claymorphism 圆润卡片阴影、`prefers-reduced-motion` 支持、移动端响应式
- `index.html`：新增 `theme-color`、Google Fonts 预连接与加载
- `public/favicon.svg`：替换为 AnimeMe 品牌标识（原误用了 Claude 徽标）
- 组件更新：`Header`（SVG 盾牌图标）、`UploadDropzone`（SVG 上传图标 + Enter/Space 键盘可达性）、`StyleSelector`（选中对勾徽标）、`ResultCompare`（`useMemo` 缓存 toDataURL 消除拖拽卡顿 + SVG 滑块 + Try another photo）、`PrivacyBadge`（SVG 对勾）、`HomePage`（hero 渐变强调词 + SVG 图标）
- `src/i18n/en.ts`：新增 `heroTitleAccent`、`runButton`；移除 hero 列表中的 ✓ 前缀（由 SVG 图标替代）

**行为变化**：
- done 状态用户可切换风格重跑，或点击 "Try another photo" 重置后换图
- 模型加载失败（`errorModel`）与推理失败（`errorProcess`）显示不同错误文案
- 对比滑块拖动不再因重复生成 PNG 而卡顿

---
