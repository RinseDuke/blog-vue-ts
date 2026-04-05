# 后端优先的前端接入设计

## 目标

- 以后端 `API_DOCUMENTATION.md` 为唯一协议准绳，完成博客前端第一阶段真实后端接入。
- 在不修改后端行为的前提下，打通主链路：注册、登录、当前用户、首页最新文章、文章列表、文章详情、写作发布、我的文章、个人资料。
- 保留现有前端灰度代码，但在功能正式上线前不让真实用户看到或触达任何后端暂未支持的灰度内容。

## 非目标

- 不修改后端接口定义、路径、字段或返回结构。
- 不在第一阶段接入评论、举报、点赞、封面上传、标签、精选、slug 独立体验等后端尚未提供的能力。
- 不为了对齐后端而重做现有页面布局与视觉系统。

## 协议准绳

- 路径、方法、请求体、响应体一律以 `C:\Bebetterone\Code\Vue\antarctica-dev\docs\API_DOCUMENTATION.md` 为准。
- `C:\Bebetterone\Code\Vue\antarctica-dev\docs\DATABASE_SCHEMA.md` 仅作为字段语义和枚举参考，不作为接口路径来源。
- 后端统一成功响应格式为：

```json
{
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

- 后端分页响应格式为：

```json
{
  "code": 200,
  "message": "Success",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 10,
    "total_pages": 10
  },
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```

## 阶段范围

### 第一阶段真实开放能力

- `POST /register`
- `POST /login`
- `POST /users/me`
- `GET /users/{id}`
- `PUT /users/{id}`
- `GET /blogs/latest`
- `GET /blogs`
- `GET /blogs/{id}`
- `POST /blogs`
- `DELETE /blogs/{id}`
- `GET /users/{id}/blogs`

### 第一阶段灰度保留但用户不可见能力

- 评论相关：`src\services\commentService.ts` 及评论组件
- 举报相关：`src\services\reportService.ts` 及举报弹窗
- 点赞交互
- 标签编辑与标签展示
- 封面上传与封面展示
- 精选文章专属呈现
- slug 独立路由体验
- 任何依赖上述能力的入口、按钮、状态标识和提示文案

这些代码允许保留在仓库中，但默认不渲染、不暴露入口、不显示半成品状态，不出现“暂不可用”“敬请期待”“灰度中”等文案。

## 设计原则

### 1. 后端优先，前端适配

- 页面、组件不直接消费后端原始响应。
- 所有真实接口必须经过 DTO -> 前端 ViewModel 的映射层。
- 当前前端已有扩展字段时，优先保持 UI 稳定，再通过映射层做最小兼容。

### 2. UI 保持稳定

- 不主动重写首页、列表、详情、写作、登录注册、个人中心的布局。
- 允许为真实后端接入做必要的字段收口、交互隐藏和状态收敛。

### 3. 灰度内容静默

- 灰度是“保留代码但不让用户感知”。
- 这不是灰按钮，不是不可用提示，而是默认从真实用户路径中移除。

## 当前前端与后端的核心差异

### 响应结构差异

- 当前 `src\services\apiClient.ts` 把响应直接当成业务对象返回。
- 后端实际返回统一包裹结构，分页接口还包含 `pagination`。
- 因此所有 service 都必须改成先解包，再做映射。

### 模型差异

当前前端 `src\types\post.ts` 的 `Post` 包含：

- `slug`
- `excerpt`
- `coverImage`
- `tags`
- `readMinutes`
- `featured`
- `likes`

后端博客模型未提供这些字段，因此第一阶段不能要求后端承担这些职责。

### 能力差异

- 后端支持博客 CRUD、用户 CRUD、登录注册。
- 后端暂不支持评论、举报、点赞、封面上传、标签。

## 总体架构

### 1. API 客户端层

修改 `src\services\apiClient.ts`：

- 统一解析成功响应和分页响应。
- 保留 `Authorization: Bearer <token>` 注入逻辑。
- 统一抛出结构化错误，优先使用后端 `message`、`error_type`、`details`。
- 增加面向业务层的帮助函数，例如：
  - `apiFetchData<T>()`
  - `apiFetchPage<T>()`

业务层不再自行猜测响应格式。

### 2. DTO 与映射层

新增后端 DTO 类型文件，例如：

- `src\types\api.ts`
- `src\types\backend.ts`

职责：

- 定义后端用户、博客、分页、错误响应类型。
- 定义博客列表项 DTO、博客详情 DTO、用户 DTO、登录响应 DTO。

新增映射函数，例如：

- `mapBackendUserToAuthUser`
- `mapBackendUserToProfile`
- `mapBackendBlogToPost`
- `mapBackendBlogListItemToPost`

### 3. Service 层

保留现有 service 职责边界，但全部改为：

- 负责拼接路径与 query
- 调用统一 API 客户端
- 解包后端响应
- 将 DTO 映射为前端模型

这样页面和 store 不需要知道后端包裹结构。

## 模型兼容策略

### 用户模型

前端继续保留：

- `AuthUser`
- `AuthSession`
- `UserProfile`

由映射层将后端字段转成当前 UI 所需字段：

- `nickname` -> `displayName`
- `avatar` -> `avatarUrl`
- `created_at` -> `joinedAt`
- `last_login_at` -> `lastActive`

### 文章模型

第一阶段保留 `Post` 作为 UI 消费模型，但字段来源调整为：

- `id`: 后端 `id`
- `slug`: 先回退为 `id`
- `title`: 后端 `title`
- `content`: 优先 `html_content`
- `excerpt`: 从 `content` 或 `html_content` 提取纯文本摘要
- `author.id`: 后端 `author.id`
- `author.name`: 后端 `author.username`
- `author.username`: 后端 `author.username`
- `publishedAt`: `created_at`
- `updatedAt`: `updated_at`
- `status`: 后端 `status`，默认 `published`
- `visibility`: 后端 `visibility`，默认 `public`
- `readMinutes`: 前端按正文长度估算
- `tags`: `[]`
- `coverImage`: `undefined`
- `featured`: `false`
- `likes`: 不参与真实后端链路

## 页面与模块接入设计

### 1. 登录 / 注册

涉及文件：

- `src\features\auth\stores\useAuthStore.ts`
- `src\views\LoginView.vue`
- `src\views\RegisterView.vue`

行为：

- 登录走 `POST /login`
- 注册走 `POST /register`
- 注册成功后按现有交互继续自动登录
- 登录成功保存 `token` 和映射后的用户信息
- 当前会话恢复后，通过 `POST /users/me` 做真实用户校验

第一阶段不开放：

- 邮箱验证码
- 找回密码

### 2. 首页最新文章

涉及文件：

- `src\services\postService.ts`
- `src\features\post\composables\usePostsStore.ts`
- `src\views\HomeView.vue`

行为：

- 首页文章来源改为真实后端博客数据
- 优先使用 `GET /blogs/latest`
- 首页列表只展示后端已发布且可见的文章

### 3. 文章列表

涉及文件：

- `src\views\ArticleListView.vue`
- `src\components\post\ArticleFilters.vue`
- `src\services\postService.ts`

行为：

- 基础数据走 `GET /blogs`
- 利用后端已有 query：`page`、`per_page`、`author_id`、`search`、`only_public`
- 第一阶段排序仍可在前端做，因为后端未提供排序协议

收口规则：

- 如果某个筛选或展示依赖灰度字段，则改成不渲染入口
- 不展示空标签、空封面、空精选状态

### 4. 搜索

涉及文件：

- `src\views\Search.vue`
- `src\features\search\composables\usePostSearchBundle.ts`

行为：

- 搜索继续保留现有 UI
- 第一阶段可以复用真实博客列表数据做前端搜索
- 如需要独立服务端搜索，可在后续阶段把搜索框改为走 `/blogs?search=`

### 5. 文章详情

涉及文件：

- `src\components\Article.vue`
- `src\views\ArticleDetailView.vue`

行为：

- 详情走 `GET /blogs/{id}`
- 第一阶段详情主路由以 `id` 为准
- slug 兼容仅保留代码层，不作为真实用户体验暴露
- 正文使用 `html_content`
- 摘要、阅读时长由前端派生

灰度处理：

- 点赞区、评论区、举报入口不对用户显示

### 6. 写作发布

涉及文件：

- `src\views\Write.vue`
- `src\components\post\PublishPanel.vue`
- `src\services\postService.ts`

真实请求体只保留：

- `title`
- `content`
- `status`
- `visibility`

第一阶段保留但不进入真实请求体：

- 标签
- 封面
- 点赞
- 其它额外装饰字段

灰度要求：

- 用户实际看不到未接入后端的附加功能入口
- 保留相关代码供后续后端补齐时恢复

### 7. 我的文章

涉及文件：

- `src\views\ProfileArticlesView.vue`
- `src\services\postService.ts`

行为：

- 数据走 `GET /users/{id}/blogs`
- 删除走 `DELETE /blogs/{id}`
- 本地草稿管理保留，但它是前端本地能力，不属于后端公开能力

### 8. 个人资料

涉及文件：

- `src\services\profileService.ts`
- `src\views\AboutView.vue`

行为：

- 读取走 `POST /users/me`
- 更新简介等信息走 `PUT /users/{id}`
- 第一阶段不开放用户删除和改密码入口，除非现有 UI 已稳定存在且后端已支持完整交互

## 灰度能力隐藏策略

为避免用户看到灰度内容，增加一层前端能力门禁，例如：

- `src\features\runtime\capabilities.ts`

第一阶段默认能力：

- `auth: true`
- `profile: true`
- `postCreate: true`
- `postDelete: true`
- `comment: false`
- `report: false`
- `like: false`
- `coverImage: false`
- `tags: false`
- `featured: false`
- `slugExperience: false`

要求：

- 当能力为 `false` 时，UI 不渲染入口
- 页面不显示占位说明
- 请求层不发送相关字段

## 错误处理

### 1. 统一后端错误转消息

- 优先展示后端 `message`
- 保留 `error_type` 供日志与测试断言使用
- `401` 触发认证相关处理
- `404` 在详情页和用户页映射为“未找到”
- `409` 用于注册、发布重名冲突提示

### 2. Mock 策略

- Mock 模式保留，作为开发兜底
- 真实后端接入完成后，默认测试重点转向真实协议适配
- Mock 不再充当真实后端字段设计来源

## 测试与验证

### 单元测试

至少覆盖：

- `src\services\apiClient.ts`
- `src\services\postService.ts`
- `src\services\profileService.ts`
- `src\features\auth\stores\useAuthStore.ts`

测试重点：

- 后端统一响应解包
- 分页响应解析
- DTO 到 ViewModel 映射
- 401/404/409 错误分支
- 灰度能力关闭时的请求体收口和 UI 隐藏逻辑

### 运行验证

需要验证：

- 注册
- 登录
- 恢复当前登录态
- 首页文章加载
- 文章列表加载、搜索、分页
- 文章详情加载
- 写作发布成功并跳转详情
- 我的文章展示与删除
- 个人资料加载与更新

### 视觉回归

必须检查：

- `src\views\HomeView.vue`
- `src\views\ArticleListView.vue`
- `src\views\ArticleDetailView.vue`
- `src\views\LoginView.vue`
- `src\views\RegisterView.vue`
- `src\views\Write.vue`
- `src\views\ProfileArticlesView.vue`
- `src\views\AboutView.vue`

检查维度：

- light / dark
- desktop / mobile
- 关键加载态、空态、错误态

## 实施顺序

### 子项目 1：核心协议层

- API 客户端统一解包
- 后端 DTO 类型
- DTO 映射层
- 错误模型统一

### 子项目 2：主链路业务接入

- auth
- posts
- profile
- 首页 / 列表 / 详情 / 发布 / 我的文章 / 个人资料

### 子项目 3：灰度门禁

- 能力开关
- UI 入口隐藏
- 请求字段收口
- 补充相关测试

## 风险与边界

- 当前 `Post` 模型偏富，第一阶段会保留一层兼容映射，不能直接把页面绑死到后端原始结构上。
- 搜索和排序中一部分体验仍然是前端派生逻辑，但数据源必须来自后端。
- 详情页第一阶段只能以 `id` 为真实主键，不能假设后端提供 slug。
- 写作页如果继续直接暴露标签、封面等入口，会违反“灰度静默”原则，因此这些入口必须从真实用户界面中隐藏。

## 结论

推荐采用“适配层优先、UI 稳定、灰度静默”的方案：

- 后端协议成为唯一真实数据来源
- 前端通过 DTO 映射层保持现有页面稳定
- 未被后端支持的能力保留代码但不暴露给用户
- 第一阶段优先跑通可上线灰测的主链路，再在后续阶段逐个打开能力
