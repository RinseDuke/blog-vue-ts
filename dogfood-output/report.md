# 前端巡检报告：Sign 博客

| 项目 | 内容 |
|---|---|
| 日期 | 2026-07-12 |
| 地址 | http://127.0.0.1:4173 |
| 范围 | 首页、文章列表、文章详情、搜索、登录注册、个人中心、写作页、移动端、暗色模式 |
| 环境 | Chrome，1440×900 与 390×844 |

## 汇总

| 严重度 | 数量 |
|---|---:|
| 高 | 2 |
| 中 | 6 |
| 低 | 2 |
| 合计 | 10 |

修复状态：10/10 已完成浏览器回归验证。

自动化基线全部通过：ESLint、TypeScript 类型检查、生产构建、29 个测试文件中的 93 个测试。以下问题来自浏览器实际操作。

## 问题

### ISSUE-001：文章作者入口打开的是当前登录用户主页

| 字段 | 内容 |
|---|---|
| 严重度 | 高 |
| 分类 | 功能 |
| 地址 | /article/1 |

文章作者显示为“前端小白”，点击作者后进入 `/about`，页面却展示刚注册的 `qa_user_20260712`。当前无法从文章进入真实作者主页。

复现：

1. 登录任意账号，打开 `/article/1`，点击作者“前端小白”。
2. 页面跳到 `/about`，标题变成当前登录账号。

证据：`screenshots/article-detail-mobile.png`、`screenshots/author-link-wrong-profile.png`

修复状态：已修复。作者入口现在进入 `/author/author-1`，展示“前端小白”的公开文章。新证据：`screenshots/fixed/author-profile.png`

### ISSUE-002：文章详情没有评论系统入口或内容

| 字段 | 内容 |
|---|---|
| 严重度 | 高 |
| 分类 | 功能 |
| 地址 | /article/1 |

文章正文结束后直接出现“返回文章列表”和页脚，没有评论列表、评论表单、回复、点赞或举报入口。项目功能说明把评论系统列为现有核心功能，但实际页面完全不可用。

证据：`screenshots/article-detail-mobile.png`

修复状态：已修复。文章详情已恢复评论数量、登录入口、评论列表、点赞与举报操作。新证据：`screenshots/fixed/article-detail-comments.png`

### ISSUE-003：修改排序后“重置”按钮仍然不可用

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | 功能 / UX |
| 地址 | /article?sort=oldest |

把排序从“最新优先”改成“最早优先”后，URL 和列表顺序已变化，但“重置”仍处于禁用状态。用户只能手动逐项恢复或修改 URL。

复现：

1. 打开文章列表，展开筛选。
2. 将排序改为“最早优先”。
3. 观察 URL 变成 `?sort=oldest`，但“重置”仍不可点击。

证据：`screenshots/issue-reset-disabled.png`

修复状态：已修复。非默认排序时“重置”可用，点击后 URL 恢复为 `/article`。新证据：`screenshots/fixed/article-reset.png`

### ISSUE-004：移动端搜索弹层没有键盘焦点约束，也无法用 Escape 关闭

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | 可访问性 / UX |
| 地址 | /write |

打开搜索弹层后连续按 Tab，焦点会离开弹层并进入底层编辑器的“H2”等按钮；按 Escape 也不会关闭弹层。键盘用户会同时操作两层界面。

证据：`screenshots/search-sheet-mobile.png`

修复状态：已修复。搜索层具备真正模态隔离、焦点循环、Escape 关闭和焦点恢复。新证据：`screenshots/fixed/mobile-search-modal.png`

### ISSUE-005：未知路由显示空白正文

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | 功能 / UX |
| 地址 | /not-found-test |

访问不存在的路由时，头部和页脚正常显示，但正文完全空白，没有 404 提示、返回首页或推荐入口。

证据：`screenshots/not-found.png`

修复状态：已修复。未知地址显示 404、当前路径和两个恢复入口。新证据：`screenshots/fixed/not-found.png`

### ISSUE-006：新注册账号展示固定的历史加入日期和默认关注数

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | 数据 / 内容 |
| 地址 | /about |

2026-07-12 新注册的账号显示“加入于 2024/05/12”，并默认显示“关注 1”。个人资料中的加入时间也重复显示同一固定日期，属于明显错误数据。

证据：`screenshots/profile-new-user-date.png`

修复状态：已修复。新账号显示实际加入日期，关注和粉丝均为 0。新证据：`screenshots/fixed/profile-new-user-mobile.png`

### ISSUE-007：多个主题区域存在明显低对比度

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | 可访问性 / 视觉 |
| 地址 | /、/about |

暗色首页的摘要、元信息和页脚文字接近背景色；浅色个人中心顶部的用户名是深色文字叠在深色渐变上，也很难辨认。这会影响弱视用户和普通屏幕下的阅读。

证据：`screenshots/home-desktop-dark.png`、`screenshots/profile-new-user-date.png`

修复状态：已修复。暗色弱化文字和资料封面身份信息达到设计对比度要求。新证据：`screenshots/fixed/home-desktop-dark.png`、`screenshots/fixed/profile-new-user-mobile.png`

### ISSUE-008：注册页默认勾选“同意用户协议”

| 字段 | 内容 |
|---|---|
| 严重度 | 中 |
| 分类 | UX / 合规 |
| 地址 | /register |

首次进入注册页时，“同意用户协议”已经勾选。协议应由用户主动确认，默认同意容易造成误操作，也不利于合规审查。

证据：`screenshots/register-mobile.png`

修复状态：已修复。首次进入注册页时协议复选框为未勾选；完成主动勾选后才能注册。

### ISSUE-009：页脚资源和社交链接都是占位链接

| 字段 | 内容 |
|---|---|
| 严重度 | 低 |
| 分类 | 功能 / 内容 |
| 地址 | 全站 |

“文档”“API”“GitHub”“Email”“RSS”均指向当前页面的 `#`，点击后没有实际内容或外部目标。看起来像正式入口，实际没有功能。

证据：`screenshots/home-mobile.png`

修复状态：已修复。页脚只保留 `/about`、`/`、`/article`、`/write` 四个真实入口，并按登录状态显示“登录/个人中心”。新证据：`screenshots/fixed/home-desktop-light.png`

### ISSUE-010：桌面首页头条摘要出现异常断句和大空隙

| 字段 | 内容 |
|---|---|
| 严重度 | 低 |
| 分类 | 视觉 / 内容 |
| 地址 | / |

桌面端头条摘要的文本被拆成不自然的片段，中间出现大块空隙，“页面重构切入”和“入门路径”等内容阅读顺序被破坏；移动端没有同样问题。

证据：`screenshots/home-desktop-clean.png`

修复状态：已修复。头条摘要使用单栏自然换行，不再出现跨栏断句。新证据：`screenshots/fixed/home-desktop-light.png`

## 建议优先级

1. 先修作者路由和文章评论缺失，这两项直接影响核心内容流程。
2. 再修筛选重置、搜索弹层键盘行为和空白 404。
3. 最后处理资料数据、对比度、占位链接与首页排版。
