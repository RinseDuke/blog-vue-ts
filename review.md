# blog-vue-ts 项目审查与真实性核验报告 (review.md)

**生成时间**：2026-09-15

**审查基准**：根目录 `memory.md` 与 `c2e6dca` 后的当前工作树；本轮已获用户明确 UI 修复授权

**验证环境**：Node v24.13.0 / npm 11.8.0 / Windows x64

---

## 当前权威状态（2026-09-15，Codex）

> 本节覆盖下方保留的历史取证与旧行动建议。标记为 **✅ 已完成** 的事项，除非相关代码再次变化或出现回归证据，否则后续 agent 不应重复查验或重复修复。

| 项目 | 状态 | 完成结果 |
| :--- | :---: | :--- |
| Markdown 冲突与 `gfm` 悬空引用 | ✅ 已完成 | 已融合富渲染配置与内建 fenced code / task list Turndown 规则，删除全部冲突标记及未定义 `gfm` 调用。 |
| TipTap 遗留栈 | ✅ 已完成 | 已删除零引用 `LivePreviewPlugin.ts`，卸载 12 个 `@tiptap/*` 直接依赖，并移除 Vite 中过时的 TipTap/ProseMirror 分块。 |
| 孤儿 UI 与死样式 | ✅ 已完成 | 已删除经复核为零引用的 DatePickerInput、DropdownSelect、Modal、Toast、Button、FeaturedHero、calendarDate 工具/测试及 `.stagger-enter*` 样式；保留正在使用的 CommentSection、ReadingProgress 和 EmptyState。 |
| 文章加载竞态 | ✅ 已完成 | `Article.vue` 使用递增请求序号，只允许最新请求更新文章、错误和 loading 状态，并新增回归测试。 |
| 未知路径 404 处理 | ✅ 已完成 | 路由末尾新增 `/:pathMatch(.*)*`，统一重定向到命名首页路由，并新增契约测试。 |
| README 技术栈同步 | ✅ 已完成 | 已在此前提交 `c2e6dca` 完成。 |

完整回归：`npm test -- --run`、`npm run test:run` 均为 46 文件 / 255 用例通过；`npm run lint`、`npm run test:coverage`、`npm run build` 均通过；官方 registry `npm audit` 为 0 vulnerabilities。构建仅保留非阻断的大 chunk 性能警告，作为独立后续优化项。

本轮变更随注释标签 `ui-stability-cleanup-20260915` 推送。下方章节作为问题发现时的历史证据保留，不再表示当前仍待处理。

---

## 目录
1. [审查概览与执行摘要](#一审查概览与执行摘要)
2. [memory.md「已修复/已完成」事项真实性核验](#二memorymd已修复已完成事项真实性核验)
3. [重大发现：memory.md 历史记录与当前代码库的脱节偏差](#三重大发现memorymd-历史记录与当前代码库的脱节偏差)
4. [项目中仍需优化的内容清单（按优先级）](#四项目中仍需优化的内容清单按优先级)
5. [后续优化行动路线图建议](#五后续优化行动路线图建议)

---

## 一、审查概览与执行摘要

本轮审查深入提取并对照了 [memory.md](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/memory.md) 的全部记录，对代码库进行了静态分析、符号级引用拓扑排查、测试执行与依赖审计。

### 核心结论摘要：
1. **已修复内容的真实性**：`memory.md` 问题状态登记表中标记为「✅ 已完成」的项（**AUTH-001**、**ENGINEERING-001**、**DEP-002**、**CONFIG-001**、**CLEANUP-001**）经全面实测，**在非 UI 层面全部真实有效，无虚假修复**；官方源 `npm audit` 也证实为 0 漏洞。
2. **唯一但致命的已知阻塞（MERGE-001）**：`src/features/post/utils/writeMarkdown.ts` 仍残留合并冲突标记（第 17、77、108 行）且存在悬空调用 `use(gfm)`（第 76 行），导致目前 `npm run dev`、`npm run build`、`npm run lint`、`npm run type-check` 及 3 个 Vitest 测试套件均处于失败状态。
3. **memory.md 存在严重脱节的陈旧建议（极重要）**：
   - `memory.md` 第四节将 **评论与举报域（A1，18 个文件）** 和 **ReadingProgress/useReadingProgress（A3）** 定性为“从未接入 UI 的全套死代码”，并建议用户批准后整体删除。
   - **实际真相**：在分支合并提交 `611f019`（引入 `a9d8565` UI 重构）后，[Article.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/Article.vue#L11-L16) **已经正式将 `CommentSection`、`ReadingProgress`、`useReadingProgress` 完整接线并渲染于模板中**！若后续 agent 盲目依据 `memory.md` 第四节进行删除，将严重损毁现有文章详情页功能！
   - 同理，`memory.md` 认为无用的 `EmptyState.vue`，实际上也已被 [HomeView.vue:65](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/views/HomeView.vue#L65) 真实接入。
4. **新发现的重大架构优化点（TipTap 僵尸依赖）**：
   - 项目在 UI 重构中已将写作编辑器从 TipTap 彻底迁移至 CodeMirror，[Write.test.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/views/Write.test.ts#L44-L46) 甚至明确断言 `not.toContain('@tiptap/vue-3')`。
   - 但 `package.json` 中仍残留了 12 个 `@tiptap/*` 依赖包，且 `src/extensions/LivePreviewPlugin.ts` 成为了唯一的僵尸文件。

---

## 二、memory.md「已修复/已完成」事项真实性核验

对 `memory.md` 表格与修改日志中声称已修复的内容逐项取证检验：

| 登记 ID | memory.md 声称修复内容 | 实测核验结果 | 具体实测证据与验证过程 |
| :--- | :--- | :---: | :--- |
| **AUTH-001** | 密码不落盘；Mock 门控到 DEV；抽取中性 `authSession.ts`；单点统一 `AUTH_SESSION_KEY`；定向测试通过 | **真实修复 ✅** | 1. [authSession.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/services/authSession.ts) 统一会话存储并进行字段白名单过滤；<br>2. [useAuthStore.ts:117-118](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/auth/stores/useAuthStore.ts#L117-L118) 初始化主动 `removeItem(USERS_KEY)`，密码仅在内存；<br>3. [apiClient.ts:113-115](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/services/apiClient.ts#L113-L115) 严格限定 `import.meta.env.DEV`；<br>4. 全仓仅 `authSession.ts:1` 声明常量，全仓 10+ 处均由其导入；<br>5. 运行 `vitest run src/services/apiClient.test.ts src/features/auth/stores/useAuthStore.test.ts` 2 文件 / 10 用例全绿。 |
| **ENGINEERING-001** | 新增 CI 工作流；配置覆盖率阈值；补齐核心行为与 API 客户端测试 | **真实修复 ✅** | 1. [.github/workflows/ci.yml](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/.github/workflows/ci.yml) 真实存在且配置完整步骤（ci/lint/test/coverage/build）；<br>2. [vitest.config.ts:26-31](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/vitest.config.ts#L26-L31) 真实配置 v8 覆盖率与阈值（statements 60 / branches 50 / functions 65 / lines 60）；<br>3. `apiClient.test.ts`、`usePostsStore.test.ts`、`useSearchHistory.test.ts` 均真实存在且运行通过。 |
| **DEP-001** | 彻底移除 `turndown-plugin-gfm` 及 Loose 类型 shim，采用内建规则 | **基本属实 ⚠️（带合并回归）** | 1. `package.json` 与 lockfile 中已完全剔除该依赖；<br>2. `src/types/turndown-plugin-gfm.d.ts` 已被物理删除；<br>3. [vite.config.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/vite.config.ts#L62) 手动分块已清理；<br>4. **异常回归**：在 [writeMarkdown.ts:76](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/post/utils/writeMarkdown.ts#L76) 的冲突区 HEAD 侧残留了 `turndownService.use(gfm)`，但未 import `gfm`，这是合并冲突导致的未愈合断口。 |
| **DEP-002** | 卸载零引用的 `@tiptap/extension-image` | **真实修复 ✅** | 全仓检索 `@tiptap/extension-image`，在 `package.json`、`package-lock.json` 和 `src/` 中均为 0 匹配。 |
| **CONFIG-001** | `.gitignore` 规则完备，配置文件卫生治理 | **真实修复 ✅** | 1. [.gitignore](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/.gitignore#L17-L19) 正确配置 `.env` 与 `.env.*`（且排除 `!.env.example`），配置了 `memory.md`；<br>2. `tsconfig.app.json` / `tsconfig.node.json` 无失效配置；<br>3. `package.json` scripts 正确使用 `eslint .`；<br>4. `README.md` 正确反映生产模式禁用 Mock、环境变量及各脚本用途。 |
| **CLEANUP-001** | 清理第四节 B1/B2/B3/B4 中的无用符号与类型导出 | **真实修复 ✅** | 1. `buildTagOptions` 与 `PostTagOption`：全仓 0 匹配（已被删除）；<br>2. 5 个未消费返回值（`closeDropdown`、`rankedByRelevance`、`isVisible`、`setTheme`、`loadSession`）：经逐文件比对各 composables/stores，均已从 return 对象中剥离；<br>3. 8 个多余类型导出（`FetchPostsParams`、`CreatePostPayload`、`ThemeMode`、`ScoredPost`、`CalendarDayCell`、`ParseQueryOptions`、`RegisterFormInput`、`RegisterFormErrors`）：均已收紧为文件内局部 interface/type，移除了 `export`；<br>4. `sendVerificationCode` 与 `useCoverUpload.coverFile`：已彻底清除；<br>5. `setPostLike` 确认保留并被 `Article.vue:245` 调用；`fetchPostBySlug` 确认保留且有测试覆盖。 |
| **安全审计** | 官方源 `npm audit` 漏洞修复（0 vulnerabilities） | **真实修复 ✅** | 默认镜像源因不实现 endpoint 报错，但使用官方源执行 `npm audit --registry=https://registry.npmjs.org` 实测输出：`found 0 vulnerabilities`。 |

---

## 三、重大发现：memory.md 历史记录与当前代码库的脱节偏差

在审查过程中，我们发现 `memory.md`（主要由 2026-09-14 的早期审查记录积累而成）中的部分断言和建议**严重落后于当前代码库实际情况**。由于 `memory.md` 被设定为多 agent 协同的记忆源，必须在 `review.md` 中澄清以下事实，防止后续 agent 发生误操作：

### 1. 评论系统与举报模块（A1）绝不可删除！
- **`memory.md` 声称**：“核心结论：整个评论/举报功能从未接入 UI——ArticleDetailView/Article.vue 不渲染评论，CommentSection 无外部导入，comment 子树是自引用闭环。建议整体删除 A1（18 个文件）”。
- **实际现状**：
  - [src/components/Article.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/Article.vue#L11) 第 11 行：`import CommentSection from '@/components/comment/CommentSection.vue'`；
  - 第 343 行模板：`<CommentSection :post-id="post.id" />`；
  - 第 328 行包含“回复”操作按钮点击直接平滑滚动到 `#topic-replies`。
- **结论**：评论与举报组件已在最新的社区重构版本中正式投产！**绝对不能作为死代码删除**。

### 2. `ReadingProgress` 与 `useReadingProgress`（A3）已真实接入
- **`memory.md` 声称**：“A3. 未接入展示组件 + 孤儿组合式：components/article/ReadingProgress.vue、features/article/composables/useReadingProgress.ts（useReadingProgress 零调用）”。
- **实际现状**：
  - [src/components/Article.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/Article.vue#L14-L16) 第 14 行导入了 `ReadingProgress`，第 16 行导入了 `useReadingProgress`；
  - 第 30 行执行了 `const { progress } = useReadingProgress()`；
  - 第 282 行模板渲染了 `<ReadingProgress :progress="progress" />`。
- **结论**：此项已是活跃功能，**不可删除**。

### 3. `EmptyState.vue`（A2）已被首页激活
- **`memory.md` 声称**：`components/ui/EmptyState.vue` 无 import、无标签使用，属可删死组件。
- **实际现状**：
  - [src/views/HomeView.vue:10](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/views/HomeView.vue#L10) 导入了 `EmptyState`；
  - [src/views/HomeView.vue:65-69](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/views/HomeView.vue#L65-L69) 在主题列表为空时渲染了 `<EmptyState title="还没有主题" description="...">`。
- **结论**：已作为社区空状态组件使用，**不可删除**。

### 4. 历史死样式与临时标记大多已自然消解
- `memory.md` 第四节 C 提到的 `ArticleListView.vue:244-265` 永久隐藏工具栏、`.control-field`、`HomeView.vue` 的 `.feed__grid`、`TopBrand.vue` 的注释代码，经排查已在 UI 重构提交中被彻底重写，当前已不复存在。

---

## 四、项目中仍需优化的内容清单（按优先级）

经过全盘代码扫描与运行排查，当前项目存在以下明确需要优化的内容：

### ✅ P0 已完成：`writeMarkdown.ts` 冲突标记与悬空引用
* **问题文件**：[src/features/post/utils/writeMarkdown.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/post/utils/writeMarkdown.ts#L17-L108)
* **现状取证**：
  1. 第 17 行包含 `<<<<<<< HEAD`；
  2. 第 76 行包含 `turndownService.use(gfm)`（但当前文件顶部并未导入 `gfm`）；
  3. 第 77 行包含 `=======`；
  4. 第 108 行包含 `>>>>>>> origin/main`；
  5. 第 78-107 行为 Codex 编写的强类型内联代码块与 TipTap 任务列表 Turndown 规则。
* **引发连锁故障**：
  - `npm run dev`：Vite esbuild 依赖扫描在第 17 行报 `Unexpected "<<"`，跳过预构建；
  - `npm run build`：`build-only`（Vite）在第 17 行报错中断构建；
  - `npm run lint`：ESLint 解析器报 `Merge conflict marker encountered`；
  - `npm run type-check`：vue-tsc 报 3 处 `TS1185: Merge conflict marker encountered`；
  - `npm test -- --run`：`writeMarkdown.test.ts`、`MarkdownPreview.ssr.test.ts`、`MarkdownPreview.test.ts` 3 个套件全部加载失败（其余 44 个套件/236 个用例均通过）。
* **优化建议方案**：
  - 保留 HEAD 侧引入的高级富渲染能力（包含针对 LaTeX、数学公式、代码高亮、锚点、脚注等的完整 DOMPurify 白名单配置）；
  - **彻底移除第 76 行悬空的 `turndownService.use(gfm)`**；
  - 接入 origin/main 侧的 `highlightedCodeBlock` 与 `tiptapTaskListItem` 规则；
  - 移除所有 Git 冲突标记，使构建、类型检查与全量测试恢复通过。

---

### ✅ P1 已完成：清除已淘汰的 TipTap 依赖族与孤儿扩展
* **问题背景**：
  - 提交 `a9d8565` 已将富文本写作彻底重构成基于 **CodeMirror 6** 的实时预览方案（[MarkdownLiveEditor.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/post/MarkdownLiveEditor.vue) + [markdownCommands.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/post/editor/markdownCommands.ts) + [livePreviewDecorations.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/post/editor/livePreviewDecorations.ts)）。
  - [Write.test.ts:44-46](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/views/Write.test.ts#L44-L46) 和 [EditorToolbar.test.ts:124](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/post/EditorToolbar.test.ts#L124) 已经加入了明确断言，保证源码中不再引入任何 `@tiptap/vue-3`、`@tiptap/starter-kit` 和 `LivePreviewPlugin`。
* **现存冗余**：
  1. **孤儿代码**：[src/extensions/LivePreviewPlugin.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/extensions/LivePreviewPlugin.ts)（238 行）全仓已无任何业务引用，是唯一的 TipTap 遗留物。
  2. **僵尸依赖**：[package.json](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/package.json#L28-L39) 中仍声明了多达 12 个不再使用的包：
     - `@tiptap/vue-3`
     - `@tiptap/starter-kit`
     - `@tiptap/pm`
     - `@tiptap/extension-link`
     - `@tiptap/extension-placeholder`
     - `@tiptap/extension-table`
     - `@tiptap/extension-table-cell`
     - `@tiptap/extension-table-header`
     - `@tiptap/extension-table-row`
     - `@tiptap/extension-task-item`
     - `@tiptap/extension-task-list`
     - `@tiptap/extension-underline`
  3. **Vite 分块过时**：[vite.config.ts:54-60](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/vite.config.ts#L54-L60) 仍保留着针对 `@tiptap` 和 `prosemirror-` 的 `manualChunks` 配置。
* **优化建议方案**：
  - 删除 `src/extensions/LivePreviewPlugin.ts`；
  - 从 `package.json` 卸载上述 12 个 `@tiptap/*` 依赖；
  - 清理 `vite.config.ts` 中的 `prosemirror-vendor` 与 `tiptap-vendor` 分块逻辑。

---

### ✅ P2 已完成：冗余组件与死代码清理（已复核确认 0 引用）
经过对全仓 `.vue` 组件的交叉引用分析，以下组件目前确认为完全无引用的孤儿代码：

1. **[src/components/ui/DatePickerInput.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/ui/DatePickerInput.vue)（395 行）与关联工具库**：
   - 当前文章筛选器 [ArticleFilters.vue:172,176](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/post/ArticleFilters.vue#L172) 已全面改用原生 `<input type="date">`；
   - `DatePickerInput.vue` 零引用；
   - 随之导致 [src/features/post/utils/calendarDate.ts](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/features/post/utils/calendarDate.ts)（除自身的单元测试外）全仓无任何外部调用。
   - **优化建议**：若无独立日期选择器规划，可安全移除 `DatePickerInput.vue`、`calendarDate.ts` 及其测试 `calendarDate.test.ts`。
2. **[src/components/ui/DropdownSelect.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/ui/DropdownSelect.vue)（219 行）**：
   - 界面中的下拉选项已改用原生 `<select>`，此自定义下拉组件全仓零引用。
   - **优化建议**：安全清理。
3. **未接入 UI 基础套件（3 个文件）**：
   - [src/components/ui/Modal.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/ui/Modal.vue)：零引用；
   - [src/components/ui/Toast.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/ui/Toast.vue)：零引用；
   - [src/components/ui/Button.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/ui/Button.vue)：零引用。
   - **优化建议**：当前社区设计有自身独立的交互与内联样式，这三个历史未完成组件可安全清理。
4. **[src/components/post/FeaturedHero.vue](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/post/FeaturedHero.vue)**：
   - 全仓仅在 `HomeView.test.ts` 中有一处断言 `not.toContain('FeaturedHero')`，无任何页面引用。
5. **死样式规则**：
   - [src/assets/base.css:349-370](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/assets/base.css#L349-L370)：`.stagger-enter`、`.stagger-enter-active` 以及 10 个 `:nth-child` 延迟，全仓无对应 class 引用。

---

### ✅ P2 已完成：修复 `Article.vue` 的文章加载竞态
* **问题文件**：[src/components/Article.vue:204-233](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/components/Article.vue#L204-L233)
* **问题表现**：
  ```ts
  async function loadPostById(id: string) {
    // ...
    const fetchedPost = await fetchPostById(id)
    // 异步完成返回后，未核验当前的 route.params.id 是否仍然等于发起时的 id
    post.value = fetchedPost
  }
  ```
* **隐患**：当用户在不同文章之间快速切换导航（例如通过上下文推荐栏或浏览器前进后退），由于网络延迟波动，先发请求后返回的数据可能覆盖后发请求的数据，导致页面展示错误的主题。
* **优化建议**：在 `await fetchPostById(id)` 完成后追加校验：
  ```ts
  if (route.params.id !== id) return
  ```

---

### ✅ P3 已完成：补齐路由 404 与文档同步
1. **补齐全局 404 捕获路由**：
   - 当前 [src/router/index.ts:19-73](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/src/router/index.ts#L19-L73) 未配置诸如 `path: '/:pathMatch(.*)*'` 的通配路由。
   - 用户访问不存在的 URL 时，页面将呈现空白且无任何友好提示。建议增加通配路由重定向至首页或展示友好错误页。
2. **文档同步**：
   - [README.md:14](file:///c:/Users/Rinne/Desktop/Project/blog-vue-ts/README.md#L14) 仍描述为 `富文本编辑器 TipTap ^3.20.0`，应更新为 CodeMirror 6 + Markdown 实时预览体系。

---

## 五、已执行行动路线图（历史计划）

以下计划已于 2026-09-15 全部执行并通过回归；保留用于审计追踪：

```
[阶段 1: 解除致命构建阻塞] (P0)
 └── 融合并修复 writeMarkdown.ts 的冲突标记，剔除悬空 use(gfm)
 └── 验证 lint、type-check、test:run、build 全线恢复通过 (CI 恢复绿灯)

[阶段 2: 依赖与架构瘦身] (P1)
 └── 移除孤儿文件 src/extensions/LivePreviewPlugin.ts
 └── 卸载 12 个无用的 @tiptap/* 依赖
 └── 清理 vite.config.ts 中过期的 prosemirror / tiptap manualChunks
 └── 运行全量测试并回归 package-lock.json

[阶段 3: 孤儿组件清理与代码健壮性加固] (P2)
 └── 清理 DatePickerInput、DropdownSelect、Modal、Toast、Button、FeaturedHero 等确认无调用的组件
 └── 在 Article.vue 中为 loadPostById 加入 route.params.id 竞态保护
 └── 清理 base.css 中未使用的 .stagger-enter 动画样式

[阶段 4: 体验与规范性收尾] (P3)
 └── 在 router/index.ts 增加 404 catch-all 兜底路由
 └── 更新 README.md 技术栈说明
```

*(本报告的历史取证已保留；当前状态以顶部“当前权威状态”为准。)*
