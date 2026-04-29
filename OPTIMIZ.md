# 博客 UI 优化计划（剩余部分）

基于已完成的首页 + PostCard 改造，以下是其余页面与组件的详细优化计划。每一节包含：**目标 → 涉及文件 → 具体改动 → 设计令牌/细节 → 验证要点**。

---

## 阶段 1：文章详情页（ArticleDetailView）

**目标**：打造沉浸式阅读体验，提升排版可读性与视觉层次。

**涉及文件**：
- `src/views/ArticleDetailView.vue`
- 可能新增 `src/components/post/ArticleHeader.vue`、`ArticleToc.vue`、`ArticleActionBar.vue`

**具体改动**：
1. **Hero 头图 + 元信息区**
   - 顶部大尺寸 cover image（16:7 比例，带渐变遮罩 `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55))`）
   - 在遮罩上叠加：标签 chips、标题（`clamp(1.8rem, 4vw, 2.8rem)`）、作者头像+名字+发布时间+阅读时长
   - 无 cover 时回退为纯色 gradient 面板 + 居中文字

2. **正文排版**
   - 最大宽度 `min(720px, 92vw)`，居中
   - 标题分级字号：h1 `2rem`、h2 `1.5rem`、h3 `1.2rem`，统一 `letter-spacing: -0.01em`
   - 段落 `line-height: 1.8`、`font-size: 17px`、段间距 `1.5em`
   - `blockquote` 加左侧 `3px solid var(--brand-500)` + 轻灰背景
   - `code` 行内：`var(--surface-strong)` 背景 + `0.9em` + `border-radius: 4px`
   - `pre` 代码块：深色背景 + 圆角 + 顶部语言标签
   - 图片自动圆角 + `box-shadow: var(--shadow-sm)`

3. **目录（TOC）侧栏**（桌面 ≥1100px 显示）
   - 右侧 sticky 面板，扫描正文 h2/h3 自动生成
   - 滚动时高亮当前章节（IntersectionObserver）
   - 移动端隐藏或折叠为顶部按钮展开

4. **浮动操作栏**
   - 左侧或底部 sticky bar：点赞、收藏、分享、评论计数跳转
   - 桌面竖排（left: 2rem, top: 50%）、移动端变底部横条
   - 点赞动画：心跳缩放 + 粒子（可选）

5. **作者信息卡**
   - 正文末尾加作者卡片：头像 + 名字 + bio + "查看更多文章"按钮

6. **相关推荐**
   - 底部 2-3 篇相关文章（按 tag 匹配），复用 `PostCard` default 变体

**新增设计令牌**（加入 `base.css`）：
```css
--article-prose-text: var(--ink-main);
--article-prose-heading: var(--ink-strong);
--article-quote-bg: color-mix(in srgb, var(--brand-100) 40%, transparent);
--article-code-bg: var(--surface-strong);
--article-code-block-bg: #1a2332;  /* dark 下 #0d1117 */
--article-toc-active: var(--brand-500);
```

**验证要点**：
- 黑白主题切换所有元素（代码块、引用、TOC）颜色正确
- 移动端 ≤768px 取消 TOC、浮动栏变底栏
- 正文长段落仍可读、标题层级清晰

---

## 阶段 2：文章列表页（ArticleListView）

**目标**：强化筛选与搜索能力，区别于首页的"精选 feed"定位。

**涉及文件**：`src/views/ArticleListView.vue`

**具体改动**：
1. **顶部筛选工具栏**（sticky top，半透明磨砂）
   - 左：搜索框（复用 TopSearchBox 样式的小号版）
   - 中：标签多选（`tag-chip` 复用首页样式，但支持多选）
   - 右：排序下拉（`DropdownSelect`）——最新 / 最热 / 最多评论

2. **结果区**
   - 两列 grid（desktop） → 一列（mobile），复用 `PostList` + `PostCard`
   - 空状态插画 + "清除筛选"按钮
   - 分页或无限滚动（推荐 IntersectionObserver 触底加载）

3. **URL 同步**：筛选条件写入 query (`?tag=vue&sort=latest`)，刷新可恢复

4. **骨架屏**：初次加载时展示 6 张 `SkeletonLoader variant="post-card"`

**验证要点**：
- 筛选条件组合（tag + 搜索 + 排序）结果正确
- URL 参数可分享
- sticky 工具栏在滚动时不遮挡卡片阴影

---

## 阶段 3：评论区（CommentSection / CommentItem / CommentForm）

**目标**：评论更具层次感，交互更现代。

**涉及文件**：
- `src/components/comment/CommentSection.vue`
- `src/components/comment/CommentItem.vue`
- `src/components/comment/CommentForm.vue`
- `src/components/comment/ReportDialog.vue`

**具体改动**：
1. **CommentForm**
   - 未登录态：折叠为灰色提示条 "登录后发表评论 →"
   - 登录态：头像 + 聚焦前为单行输入 `"写下你的想法..."`，聚焦后展开为 textarea + 工具栏（表情、@、取消/发布按钮）
   - 发布按钮禁用态使用 `opacity: 0.5` + `cursor: not-allowed`
   - 字数计数器 `0/500`（接近上限变橙色）

2. **CommentItem**
   - 头像（36px 圆形）+ 右侧卡片布局
   - 顶部：用户名（粗体）+ 楼层号 + 相对时间（`2小时前`，hover 显示绝对时间 tooltip）
   - 正文：`line-height: 1.7`
   - 底部操作条：点赞（带数字）、回复、举报（仅悬停显示）
   - 嵌套回复：左侧 `2px` 缓色竖线 + 缩进 `2.5rem`，最多 2 级，再深显示"查看更多回复"

3. **CommentSection**
   - 顶部标题 "评论 (N)" + 排序切换（最新 / 最热）
   - 空态：插画 + "成为第一个评论者"
   - 加载更多按钮替换为触底加载

4. **ReportDialog**
   - 居中 modal，遮罩 `backdrop-filter: blur(8px)`
   - 选项用 radio card 而非原生 radio
   - 动画：`scale(0.95) → scale(1)` + `opacity`

**新增设计令牌**：
```css
--comment-item-bg: var(--surface);
--comment-item-border: var(--line-soft);
--comment-nested-line: var(--line-strong);
--comment-action-hover: var(--brand-500);
```

**验证要点**：
- 嵌套层级样式正确、响应式下不溢出
- 举报 modal 键盘可关闭（Esc）、焦点陷阱
- 未登录态不误导用户

---

## 阶段 4：导航栏 + 页脚（Navigation / Footer）

**目标**：统一顶部导航的一致性，让页脚承载更多信息。

**涉及文件**：
- `src/components/navigation/TopNavigation.vue`
- `src/components/navigation/TopHeaderLayout.vue`
- `src/components/navigation/TopBrand.vue`
- `src/components/navigation/TopThemeToggle.vue`
- `src/components/navigation/MobileTopTabs.vue`
- `src/components/navigation/TopFooter.vue`

**具体改动**：
1. **桌面导航（TopNavigation）**
   - 背景使用 `backdrop-filter: blur(20px) saturate(1.8)` + `var(--surface-frost)`
   - 滚动时增加 `box-shadow` + 边框下沿（监听 `window.scrollY > 4`）
   - 活动链接使用底部 2px brand 色横线 + 文字色加深，而不是当前的背景块
   - 主题切换按钮加入图标过渡动画（太阳→月亮 rotate 360°）

2. **Brand**
   - Logo 左侧加图标（可用 SVG：几何风格博客本标志）
   - 站名使用更有特点的字重 `800` + 微字间距

3. **移动端（MobileTopTabs）**
   - 底部 tab bar，大图标 + 小文字
   - 活动项背景圆胶囊 + brand 色

4. **页脚（TopFooter）**
   - 分 3-4 列：关于 / 导航 / 资源 / 订阅
   - 顶部添加 newsletter 订阅输入框
   - 底部：版权 + 社交图标（GitHub、邮箱、RSS）
   - 移动端折叠为手风琴或单列居中

**验证要点**：
- 滚动时 header 不抖动、blur 生效
- 主题切换动画平滑
- 移动底部 tab 不遮挡内容（页面底部增加 `padding-bottom`）

---

## 阶段 5：搜索（TopSearchBox / SearchDropdownContent / MobileSearchSheet）

**目标**：降低搜索门槛，结果预览更直观。

**涉及文件**：
- `src/components/search/TopSearchBox.vue`
- `src/components/search/SearchDropdownContent.vue`
- `src/components/search/MobileSearchSheet.vue`
- `src/views/Search.vue`

**具体改动**：
1. **输入框**
   - 宽度默认 `240px`，聚焦时扩展到 `360px`（`transition: width 0.2s`）
   - 左侧搜索图标 + 右侧 `⌘K` 提示（macOS）或 `Ctrl+K`（其他）
   - 全局快捷键聚焦

2. **下拉结果（SearchDropdownContent）**
   - 三段式：`热搜榜` / `最近搜索`（未输入时） → `文章结果 + 标签结果`（有输入时）
   - 结果项显示：标题（高亮命中词）+ 小号摘要（1 行）+ 右侧相关度或日期
   - 键盘 ↑↓ 选择 + Enter 跳转 + Esc 关闭

3. **移动端（MobileSearchSheet）**
   - 全屏 sheet 从顶部滑入
   - 顶部大输入框 + 取消按钮
   - 结果列表 tap 跳转

4. **Search 页**
   - 左侧筛选面板（tag、时间范围、作者）
   - 右侧结果列表复用 `PostCard`

**验证要点**：
- 键盘导航可用、焦点可见
- 高亮命中词不破坏 HTML 结构
- 移动端 sheet 的 body scroll lock 生效

---

## 阶段 6：认证页（LoginView / RegisterView）

**目标**：打造聚焦、无干扰的登录注册体验。

**涉及文件**：
- `src/views/LoginView.vue`
- `src/views/RegisterView.vue`

**具体改动**：
1. **布局**
   - 左右 split（桌面）：左侧品牌插画/名言（渐变背景 + SVG 图形）；右侧表单
   - 移动端纯右侧（顶部小 logo）

2. **表单细节**
   - 输入框聚焦时 label 上浮（floating label）
   - 密码显示/隐藏切换（眼睛图标）
   - 实时校验反馈（邮箱格式、密码强度条）
   - 提交按钮全宽 + brand 渐变 + loading 态转圈

3. **辅助链接**
   - 登录页底部："还没有账号？立即注册" + "忘记密码？"
   - 注册页底部："已有账号？登录"
   - 社交登录占位（GitHub / Google 图标按钮）

**验证要点**：
- 表单校验错误即时显示且不破坏布局
- 密码强度条颜色从红→黄→绿平滑过渡
- 移动端键盘弹出不遮挡提交按钮

---

## 阶段 7：写作页（Write）

**目标**：编辑器更专业，预览更真实。

**涉及文件**：`src/views/Write.vue`

**具体改动**：
1. **顶部条**
   - 保存状态 "已自动保存于 14:23" + 字数统计 + 预估阅读时长
   - 右侧：切换模式（编辑 / 分屏 / 预览）+ "发布"按钮

2. **元数据面板**（可折叠）
   - 标题（大字号 `1.8rem` 无边框输入）
   - 封面图上传区（拖拽 or 点击）+ 预览
   - 标签 chips 输入（回车添加、可删除）
   - 摘要 textarea
   - 是否精选 toggle

3. **编辑器主体**
   - 工具栏简化为常用（加粗/斜体/标题/链接/图片/代码/引用）+ 更多菜单
   - 图片粘贴/拖拽自动上传
   - 键盘快捷键支持（Ctrl+B/I/K）

4. **预览区**
   - 分屏模式下右侧实时预览，样式与文章详情页完全一致
   - 滚动同步（可选）

**验证要点**：
- 大段落编辑无卡顿
- 切换模式保留草稿
- 移动端编辑器工具栏可滚动

---

## 阶段 8：个人主页（ProfileEntryView / ProfileArticlesView）

**目标**：用户品牌化展示。

**涉及文件**：
- `src/views/ProfileEntryView.vue`
- `src/views/ProfileArticlesView.vue`

**具体改动**：
1. **头部**
   - Banner 背景（用户自定义或渐变）
   - 头像（120px 圆形，-50px marginTop 与 banner 重叠）
   - 名字 + bio + 统计（文章数 / 点赞数 / 关注者）
   - "编辑资料"或"关注"按钮

2. **Tab 切换**
   - 文章 / 喜欢 / 评论 / 关于
   - 下划线跟随动画（`::after` 伪元素 + translate）

3. **文章列表**
   - 复用 `PostList`，但每张卡片底部加"编辑/删除"按钮（通过 `footer-actions` slot，已保留）

**验证要点**：
- 自己 vs 他人的主页按钮正确（编辑 vs 关注）
- 空状态友好

---

## 阶段 9：通用 UI 组件

**涉及文件**：
- `src/components/ui/DropdownSelect.vue`
- `src/components/ui/DatePickerInput.vue`
- 新增 `src/components/ui/Button.vue`、`Toast.vue`、`Modal.vue`、`EmptyState.vue`

**具体改动**：
1. **Button**：统一 primary / secondary / ghost / danger 四变体 + sm/md/lg 三尺寸 + loading/disabled 态
2. **Toast**：右上角堆叠、自动消失、支持 success/error/info/warning 四色
3. **Modal**：统一遮罩 blur、scale+opacity 动画、焦点陷阱、Esc 关闭
4. **EmptyState**：可配置 icon + 标题 + 描述 + 主动作按钮
5. **DropdownSelect**：键盘导航、选项动画（fade+slide 4px）
6. **DatePickerInput**：统一日历样式、范围选择

**验证要点**：
- 所有组件支持暗色主题
- a11y：焦点环、ARIA 属性、键盘操作

---

## 阶段 10：全局细节 & 性能

1. **图片优化**
   - 全站 `<img>` 添加 `loading="lazy"` + `decoding="async"`
   - 封面图改用 `<picture>` 提供 webp 回退

2. **动画**
   - 统一使用 `cubic-bezier(0.22, 1, 0.36, 1)`（ease-out-quint）
   - 尊重 `prefers-reduced-motion`

3. **字体**
   - 给 Manrope 加 `font-display: swap`（当前通过 Google Fonts URL）
   - 考虑自托管 woff2 以去除外部依赖

4. **滚动**
   - 全局 `scroll-behavior: smooth`
   - 自定义滚动条样式（细、圆角、hover 变色）

5. **无障碍**
   - 所有交互元素 focus-visible 样式
   - 语义标签（`<nav>` `<main>` `<article>` `<aside>`）
   - 图片完整 alt

6. **代码分包**
   - 当前 `Write-*.js` 548KB，考虑按需加载 markdown 编辑器依赖

---

## 推荐改造顺序

1. **阶段 4**（导航+页脚）→ 影响所有页面，优先统一
2. **阶段 9**（通用组件）→ 后续页面直接复用
3. **阶段 1**（文章详情）→ 用户停留时间最长的页面
4. **阶段 3**（评论区）→ 互动核心
5. **阶段 2**（文章列表）→ 发现内容
6. **阶段 5**（搜索）→ 提升查找效率
7. **阶段 6**（认证）→ 低频但第一印象
8. **阶段 8**（个人主页）
9. **阶段 7**（写作页）→ 复杂度最高，放最后
10. **阶段 10**（全局细节）→ 贯穿整个过程，最后统一收尾

---

## 通用执行 checklist（每个页面改造时可参照）

- [ ] 先在 `base.css` 新增该页面需要的设计令牌（light + dark 两套）
- [ ] 组件使用 `scoped lang="less"`，BEM 命名
- [ ] 所有颜色走 `var(--xxx)`，禁止硬编码
- [ ] 圆角用 `var(--radius-sm|md|lg)`
- [ ] 阴影用 `var(--shadow-sm|md)`
- [ ] 字号使用 `clamp()` 响应式
- [ ] ≤768px 单独适配
- [ ] 加 loading/error/empty 三态
- [ ] 交互元素 hover + focus-visible 样式
- [ ] 改完运行 `npx vue-tsc --noEmit` + `npx vite build` 验证
- [ ] 黑白主题切换回归测试
