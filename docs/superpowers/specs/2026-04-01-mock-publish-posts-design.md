# Mock 模式发文与展示设计

## 目标

- 在 mock 模式下支持从 `write` 页面发布文章，并将结果持久化到 `localStorage`。
- 新发布的文章在发布成功后立即出现在首页最新文章、文章列表和文章详情页。
- 刷新页面后仍能保留并展示这些 mock 文章，便于持续回归和体验观察。
- 保持页面层调用方式不变，尽量复用现有 `postService` 和 `postsStore` 链路。

## 当前情况

- `src/services/postService.ts` 已经承载了 mock / real 两套文章读取逻辑，也已经存在本地已发布文章的存储键位。
- `src/views/Write.vue` 当前通过 `createPost(...)` 发布文章，随后调用 `postsStore.refreshPosts()` 并跳转到文章详情页。
- 首页、文章列表、详情页都依赖 `postService` 提供的数据，因此只要 service 层数据源一致，页面链路就能一起打通。
- 这次范围只覆盖“已发布文章可持久化并公开展示”，不扩展草稿、编辑、删除。

## 方案对比

### 方案 1：在 `postService` 内统一 mock 读写入口

- `fetchPosts`、`fetchPostById`、`createPost` 统一基于“内置 mock 文章 + localStorage 已发布文章”工作。
- 页面层继续只调用 service，不新增新的 mock store 或 mock API。

这是本次采用方案。改动最小，最符合当前项目已有结构，也最利于尽快打通完整回归链路。

### 方案 2：补一层 mock API

- 为 mock 模式提供模拟的 `GET /posts`、`GET /posts/:id`、`POST /posts`。
- `postService` 再转调 mock API。

优点是结构更接近真实后端，但这次目标是快速稳定发文回归链路，额外抽象成本偏高。

### 方案 3：新增独立 mock posts store

- 由 store 管理本地文章持久化和展示。
- 页面在 mock 模式下改为读取这个 store。

优点是状态显式，但会和现有 service / store 形成双轨来源，增加后续维护成本。

## 设计决策

### 1. 继续以 `postService` 作为 mock 文章唯一数据入口

- mock 模式下的文章数据统一由 `src/services/postService.ts` 提供。
- 内置文章继续来自 `src/mocks/posts.ts`，作为默认基础内容。
- 用户新发布的文章继续落到 `localStorage`，并与内置文章合并后参与查询与排序。
- 页面和 store 不直接读写 `localStorage`，避免多处维护相同规则。

### 2. 发布成功后的展示规则统一为“公开已发布文章”

- 本次 mock 发文默认按公开、已发布处理。
- 发布时间使用创建时的 ISO 时间戳，确保首页最新文章和文章列表按时间排序时立即生效。
- `createPost(...)` 成功后返回完整 `Post` 对象，`Write.vue` 继续沿用现有的 `refreshPosts()` + 跳详情逻辑。
- 详情页通过 `id` 或 `slug` 查询时，需要能命中新发布的本地文章。

### 3. 合并数据时保持单一事实来源

- mock 查询统一从一个合并函数读取结果，而不是分别从 `mockPosts` 和 `localStorage` 做临时查找。
- 合并顺序以本地已发布文章优先，避免同 `id` 或同 `slug` 时展示旧内容。
- 对列表查询、详情查询、用户文章查询使用同一套过滤与可见性规则，避免首页、列表、详情出现不同步。

### 4. 异常处理以“不中断测试链路”为原则

- `localStorage` 缺失、解析失败或数据结构非法时，不让页面崩溃，直接回退到内置 mock 文章集合。
- 新发布文章时重新写入合法数组，尽量把损坏状态收敛回正常状态。
- 如果 mock 模式下用户未登录，继续沿用现有鉴权错误提示，不改变登录前置条件。

## 数据流

1. 用户在 `write` 页面提交文章。
2. `Write.vue` 调用 `createPost(payload)`。
3. mock 模式下，`createPost`：
   - 校验登录态。
   - 生成完整 `Post` 对象。
   - 读取并合并现有本地已发布文章。
   - 将新文章写回 `localStorage`。
4. `Write.vue` 调用 `postsStore.refreshPosts()`，由 store 重新触发 `fetchPosts()`。
5. 首页最新文章、文章列表、详情页继续通过现有 store / service 链路读取更新后的文章集合。

## 影响文件

- `src/services/postService.ts`
- `src/services/postService.test.ts`
- `src/views/Write.vue`（仅在发现现有发布链路仍有阻断点时做最小修正）

## 测试与验证

- 在 `src/services/postService.test.ts` 增补或校正以下覆盖：
  - mock 模式下发文后，`fetchPosts()` 能读到新文章。
  - mock 模式下发文后，`fetchPostById()` / `fetchPostBySlug()` 能命中新文章。
  - 刷新场景下仍可从 `localStorage` 读回新文章。
  - 本地数据损坏时能安全回退。
- 运行相关测试。
- 运行 `npm run type-check`。
- 运行项目的最近似运行校验命令，确认 mock 发文主链路可实际操作。
- 做视觉回归，至少检查：
  - `write` 发布流程页
  - 首页最新文章区
  - 文章列表页
  - 文章详情页
- 如果本次改动影响到界面呈现或交互，按项目约定补查浅色 / 深色，以及桌面 / 移动端。
