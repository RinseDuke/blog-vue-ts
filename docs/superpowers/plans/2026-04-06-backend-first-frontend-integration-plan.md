# 后端优先前端接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以后端 `API_DOCUMENTATION.md` 为唯一协议准绳，打通前端第一阶段真实后端链路，同时把后端暂未支持的灰度内容静默隐藏到真实用户不可见。

**Architecture:** 先改统一 API 解包和 DTO 映射层，再对接 auth / blogs / profile 业务链路，最后通过能力门禁把静态假数据和未支持功能从真实用户路径中收口。页面继续消费现有前端 ViewModel，避免 UI 大范围震荡。

**Tech Stack:** Vue 3、Pinia、Vue Router、TypeScript、Vite、Vitest

**Runtime prerequisites:** 本地后端服务已启动；前端运行验证时配置 `VITE_API_BASE_URL=http://localhost:8080/api/v1` 且 `VITE_USE_MOCK=false`。

**Workspace note:** 当前工作区已经存在与本计划无关的 `.gitignore`、`eslint.config.mjs` 以及 `.codex-artifacts` 索引移除改动。执行本计划时严禁使用 `git add .` 或其它会把无关改动混入提交的命令；每一步都只按文件路径精确暂存。

---

## File Structure

- `src/types/api.ts`
  - 定义统一成功响应、分页响应、错误响应和分页元数据类型。
- `src/types/backend.ts`
  - 定义后端用户 / 博客 DTO 类型，严格对齐 `API_DOCUMENTATION.md`。
- `src/features/runtime/capabilities.ts`
  - 统一维护第一阶段允许暴露给真实用户的能力开关。
- `src/services/apiClient.ts`
  - 统一处理响应解包、错误抛出、鉴权头注入。
- `src/services/apiClient.test.ts`
  - 锁定统一响应 / 分页响应 / 错误响应的解析行为。
- `src/features/auth/stores/useAuthStore.ts`
  - 对接 `/login`、`/register`、`/users/me`，管理真实会话。
- `src/features/auth/stores/useAuthStore.test.ts`
  - 锁定真实后端模式下的登录、注册、会话恢复。
- `src/services/postService.ts`
  - 对接 `/blogs`、`/blogs/latest`、`/blogs/{id}`、`/users/{id}/blogs`、`DELETE /blogs/{id}`。
- `src/services/postService.test.ts`
  - 锁定真实后端模式下的博客列表、详情、发布、删除和字段映射。
- `src/features/post/composables/usePostsStore.ts`
  - 继续提供全局文章缓存，但数据来源改为真实后端映射结果。
- `src/services/profileService.ts`
  - 对接 `/users/me`、`PUT /users/{id}`。
- `src/services/profileService.test.ts`
  - 锁定真实后端模式下的个人资料读取和更新。
- `src/main.ts`
  - 应用启动时恢复主题并在挂载前校验真实登录态。
- `src/views/AboutView.vue`
  - 去掉真实用户可见的静态活动流和关系指标，仅显示后端或本地真实可支撑内容。
- `src/views/AboutView.test.ts`
  - 锁定个人中心移动端结构仍紧凑，同时灰度内容不再暴露。

## Task 1: 锁定统一响应解包与灰度门禁基础

**Files:**
- Create: `src/types/api.ts`
- Create: `src/types/backend.ts`
- Create: `src/features/runtime/capabilities.ts`
- Create: `src/features/runtime/capabilities.test.ts`
- Create: `src/services/apiClient.test.ts`
- Modify: `src/services/apiClient.ts`

- [ ] **Step 1: 先写失败测试，锁定统一响应和灰度门禁默认值**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetchData, apiFetchPage } from '@/services/apiClient'
import { runtimeCapabilities } from '@/features/runtime/capabilities'

describe('apiClient response envelope', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: 'Success',
            data: [{ id: 'blog-1', title: 'Envelope' }],
            pagination: { total: 1, page: 1, per_page: 10, total_pages: 1 },
            timestamp: '2026-04-06T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('unwraps success envelopes via apiFetchData', async () => {
    await expect(apiFetchData<{ id: string; title: string }>('/users/me')).resolves.toEqual({
      id: 'blog-1',
      title: 'Envelope',
    })
  })

  it('unwraps paginated envelopes via apiFetchPage', async () => {
    await expect(apiFetchPage<{ id: string; title: string }>('/blogs')).resolves.toEqual({
      data: [{ id: 'blog-1', title: 'Envelope' }],
      pagination: { total: 1, page: 1, perPage: 10, totalPages: 1 },
    })
  })

  it('surfaces backend message on error envelopes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 409,
            message: 'Title already exists',
            error_type: 'CONFLICT',
            details: 'same title',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(apiFetchData('/blogs')).rejects.toEqual(
      expect.objectContaining<ApiError>({
        status: 409,
        message: 'Title already exists',
        errorType: 'CONFLICT',
      }),
    )
  })
})

describe('runtimeCapabilities defaults', () => {
  it('keeps unsupported launch features disabled by default', () => {
    expect(runtimeCapabilities.comment).toBe(false)
    expect(runtimeCapabilities.report).toBe(false)
    expect(runtimeCapabilities.like).toBe(false)
    expect(runtimeCapabilities.profileActivity).toBe(false)
    expect(runtimeCapabilities.relationshipSummary).toBe(false)
    expect(runtimeCapabilities.tags).toBe(false)
    expect(runtimeCapabilities.coverImage).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试，确认当前基线失败**

Run: `npm run test:run -- src/services/apiClient.test.ts src/features/runtime/capabilities.test.ts`

Expected: FAIL，至少包含以下一种失败：
- `apiFetchData is not a function`
- `apiFetchPage is not a function`
- `Cannot find module '@/features/runtime/capabilities'`

- [ ] **Step 3: 实现统一响应类型、解包辅助和灰度能力门禁**

```ts
// src/types/api.ts
export interface ApiSuccessResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface ApiPaginationDto {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiPaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: ApiPaginationDto
}

export interface ApiErrorResponse {
  code: number
  message: string
  error_type?: string
  details?: string
}

export interface PageResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}
```

```ts
// src/types/backend.ts
export interface BackendUserDto {
  id: string
  username: string
  nickname: string
  email: string
  avatar?: string | null
  bio?: string | null
  created_at?: string | null
  last_login_at?: string | null
  visibility?: 'public' | 'private'
}

export interface BackendAuthorDto {
  id: string
  username: string
}

export interface BackendBlogListItemDto {
  id: string
  title: string
  author: BackendAuthorDto
  created_at: string
  updated_at?: string
  visibility?: 'public' | 'private'
}

export interface BackendBlogDto extends BackendBlogListItemDto {
  content?: string
  html_content?: string
  status?: 'draft' | 'published'
}

export interface BackendLoginDto {
  token: string
  user: BackendUserDto
}
```

```ts
// src/features/runtime/capabilities.ts
export const runtimeCapabilities = {
  auth: true,
  profile: true,
  postCreate: true,
  postDelete: true,
  comment: false,
  report: false,
  like: false,
  coverImage: false,
  tags: false,
  featured: false,
  slugExperience: false,
  profileActivity: false,
  relationshipSummary: false,
} as const
```

```ts
// src/services/apiClient.ts
import type { ApiErrorResponse, ApiPaginatedResponse, ApiSuccessResponse, PageResult } from '@/types/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly errorType?: string,
    public readonly details?: string,
  ) {
    super(body || `请求失败：${status}`)
    this.name = 'ApiError'
  }
}

function normalizePageResult<T>(payload: ApiPaginatedResponse<T>): PageResult<T> {
  return {
    data: payload.data,
    pagination: {
      total: payload.pagination.total,
      page: payload.pagination.page,
      perPage: payload.pagination.per_page,
      totalPages: payload.pagination.total_pages,
    },
  }
}

export async function apiFetchData<T>(path: string, options: RequestInit = {}) {
  const payload = await apiFetch<ApiSuccessResponse<T>>(path, options)
  return payload.data
}

export async function apiFetchPage<T>(path: string, options: RequestInit = {}) {
  const payload = await apiFetch<ApiPaginatedResponse<T>>(path, options)
  return normalizePageResult(payload)
}
```

- [ ] **Step 4: 重新运行定向测试，确认基础层已锁定**

Run: `npm run test:run -- src/services/apiClient.test.ts src/features/runtime/capabilities.test.ts`

Expected: PASS

- [ ] **Step 5: 提交基础层**

```bash
git add src/types/api.ts src/types/backend.ts src/features/runtime/capabilities.ts src/features/runtime/capabilities.test.ts src/services/apiClient.ts src/services/apiClient.test.ts
git commit -m "feat: add backend envelope parsing foundation"
```

## Task 2: 对齐 auth 流程与真实会话恢复

**Files:**
- Modify: `src/features/auth/stores/useAuthStore.ts`
- Modify: `src/features/auth/stores/useAuthStore.test.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 先写失败测试，锁定真实后端模式下的注册 / 登录 / 会话恢复**

```ts
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

describe('useAuthStore backend mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('unwraps backend login envelopes and persists token + user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: 'Success',
            data: {
              token: 'server-token',
              user: {
                id: 'user-1',
                username: 'tester',
                nickname: 'Tester',
                email: 'tester@example.com',
                visibility: 'public',
              },
            },
            timestamp: '2026-04-06T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const store = useAuthStore()
    await store.login({ username: 'tester', password: 'SecurePass123', rememberMe: true })

    expect(store.isLoggedIn).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(store.userEmail).toBe('tester@example.com')
  })

  it('rehydrates a stored session through POST /users/me before mount', async () => {
    localStorage.setItem(
      'blog_auth_session_v1',
      JSON.stringify({
        email: 'tester@example.com',
        rememberMe: true,
        loggedAt: '2026-04-06T00:00:00.000Z',
        token: 'server-token',
        user: { id: 'user-1', username: 'tester', nickname: 'Tester', email: 'tester@example.com', visibility: 'public' },
      }),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: 'Success',
            data: {
              id: 'user-1',
              username: 'tester',
              nickname: 'Tester',
              email: 'tester@example.com',
              visibility: 'public',
            },
            timestamp: '2026-04-06T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const store = useAuthStore()
    await store.hydrateSession()

    expect(store.isLoggedIn).toBe(true)
    expect(store.username).toBe('tester')
  })
})
```

- [ ] **Step 2: 运行 auth 定向测试，确认当前失败**

Run: `npm run test:run -- src/features/auth/stores/useAuthStore.test.ts`

Expected: FAIL，至少包含以下一种失败：
- `store.hydrateSession is not a function`
- 后端包裹响应未解包导致断言不匹配

- [ ] **Step 3: 实现 auth store 的真实后端模式**

```ts
// src/features/auth/stores/useAuthStore.ts
async function hydrateSession() {
  const storedSession = readStoredAuthSession()
  if (!storedSession) {
    session.value = null
    return
  }

  if (isMockMode()) {
    session.value = storedSession
    return
  }

  try {
    const me = await apiFetchData<BackendUser>('/users/me', {
      method: 'POST',
      body: JSON.stringify({ user_id: storedSession.user.id }),
    })

    persistSession({
      ...storedSession,
      email: normalizeEmail(me.email),
      user: mapBackendUser(me),
    })
  } catch (error) {
    logout()
    throw error
  }
}

// 保持现有 mock 分支实现不变，只替换每个函数的真实后端分支
async function login(payload: AuthCredentials) {
  const data = await apiFetchData<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({
      username: normalizeUsername(payload.username),
      password: payload.password,
    }),
  })

  persistSession(buildSession(mapBackendUser(data.user), payload.rememberMe, data.token))
}

async function register(payload: RegisterPayload) {
  await apiFetchData<BackendUser>('/register', {
    method: 'POST',
    body: JSON.stringify({
      username: normalizeUsername(payload.username),
      nickname: payload.nickname.trim(),
      password: payload.password,
      email: normalizeEmail(payload.email),
      avatar: payload.avatar,
      bio: payload.bio,
      visibility: payload.visibility === 'private' ? 'private' : 'public',
    }),
  })

  await login({
    username: payload.username,
    password: payload.password,
    rememberMe: payload.rememberMe,
  })
}
```

```ts
// src/main.ts
async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  useThemeStore(pinia).hydrateTheme()

  const authStore = useAuthStore(pinia)
  await authStore.hydrateSession().catch((error) => {
    console.warn('Unable to restore auth session', error)
  })

  app.use(router)
  app.mount('#app')
}

void bootstrap()
```

- [ ] **Step 4: 重新运行 auth 定向测试**

Run: `npm run test:run -- src/features/auth/stores/useAuthStore.test.ts`

Expected: PASS

- [ ] **Step 5: 提交 auth 对齐**

```bash
git add src/features/auth/stores/useAuthStore.ts src/features/auth/stores/useAuthStore.test.ts src/main.ts
git commit -m "feat: align auth flow with backend envelopes"
```

## Task 3: 对齐博客 service 与前端文章映射

**Files:**
- Modify: `src/services/postService.ts`
- Modify: `src/services/postService.test.ts`
- Modify: `src/features/post/composables/usePostsStore.ts`

- [ ] **Step 1: 先写失败测试，锁定真实后端博客映射与发布请求体**

```ts
describe('postService backend mode', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('maps paginated blog list responses into frontend posts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: 'Success',
            data: [
              {
                id: 'blog-1',
                title: 'Backend Title',
                author: { id: 'user-1', username: 'tester' },
                created_at: '2026-04-06T00:00:00.000Z',
                updated_at: '2026-04-06T01:00:00.000Z',
                visibility: 'public',
              },
            ],
            pagination: { total: 1, page: 1, per_page: 10, total_pages: 1 },
            timestamp: '2026-04-06T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(fetchPosts()).resolves.toEqual([
      expect.objectContaining({
        id: 'blog-1',
        slug: 'blog-1',
        title: 'Backend Title',
        author: expect.objectContaining({ id: 'user-1', name: 'tester' }),
        tags: [],
        featured: false,
      }),
    ])
  })

  it('sends only backend-supported fields when creating a blog', async () => {
    setSession('writer@example.com', 'Writer', 'user-1')
    const fetchMock = vi.fn(async (_input, init) => {
      expect(init?.method).toBe('POST')
      expect(init?.body).toBe(
        JSON.stringify({
          title: 'New Title',
          content: '# Body',
          status: 'published',
          visibility: 'public',
        }),
      )

      return new Response(
        JSON.stringify({
          code: 201,
          message: 'Created',
          data: {
            id: 'blog-2',
            title: 'New Title',
            content: '# Body',
            html_content: '<h1>Body</h1>',
            author: { id: 'user-1', username: 'writer' },
            created_at: '2026-04-06T00:00:00.000Z',
            updated_at: '2026-04-06T00:00:00.000Z',
            visibility: 'public',
          },
          timestamp: '2026-04-06T00:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    await createPost({
      title: 'New Title',
      markdown: '# Body',
      html: '<h1>Body</h1>',
      status: 'published',
      visibility: 'public',
      tags: ['should-not-send'],
      coverImage: 'https://example.com/cover.png',
    })
  })
})
```

- [ ] **Step 2: 运行 postService 定向测试，确认当前失败**

Run: `npm run test:run -- src/services/postService.test.ts`

Expected: FAIL，至少包含以下一种失败：
- 真实模式下未解包分页响应
- 创建请求体仍带有 `tags` 或 `coverImage`

- [ ] **Step 3: 实现真实博客接口映射和最小请求体**

```ts
// src/services/postService.ts
import { apiFetchData, apiFetchPage } from '@/services/apiClient'

interface BackendBlogListItemDto {
  id: string
  title: string
  author: { id: string; username: string }
  created_at: string
  updated_at?: string
  visibility?: 'public' | 'private'
}

interface BackendBlogDto extends BackendBlogListItemDto {
  content?: string
  html_content?: string
  status?: 'draft' | 'published'
}

function mapBackendBlogToPost(blog: BackendBlogListItemDto | BackendBlogDto): Post {
  const detail = blog as BackendBlogDto
  const excerptSource = detail.content ?? detail.html_content ?? blog.title

  return {
    id: blog.id,
    slug: blog.id,
    title: blog.title,
    excerpt: buildExcerpt(excerptSource) || '暂无摘要',
    content: detail.html_content,
    tags: [],
    author: {
      id: blog.author.id,
      name: blog.author.username,
      username: blog.author.username,
    },
    publishedAt: blog.created_at,
    updatedAt: blog.updated_at,
    readMinutes: estimateReadMinutes(detail.content ?? excerptSource),
    featured: false,
    status: detail.status ?? 'published',
    visibility: blog.visibility ?? 'public',
  }
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  const query = new URLSearchParams({
    page: '1',
    per_page: String(params.limit ?? DEFAULT_REAL_LIMIT),
    only_public: 'true',
  })

  if (params.search) query.set('search', params.search)
  if (params.authorId) query.set('author_id', params.authorId)

  const page = await apiFetchPage<BackendBlogListItemDto>(`/blogs?${query.toString()}`)
  return page.data.map(mapBackendBlogToPost)
}

export async function fetchPostById(id: string) {
  const blog = await apiFetchData<BackendBlogDto>(`/blogs/${id}`)
  return mapBackendBlogToPost(blog)
}

export async function createPost(payload: CreatePostPayload) {
  const blog = await apiFetchData<BackendBlogDto>('/blogs', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title.trim(),
      content: payload.markdown,
      status: payload.status ?? 'published',
      visibility: payload.visibility ?? 'public',
    }),
  })

  return mapBackendBlogToPost(blog)
}
```

```ts
// src/features/post/composables/usePostsStore.ts
inflight = fetchPosts({ limit: 100 })
```

- [ ] **Step 4: 重新运行 blogs 定向测试**

Run: `npm run test:run -- src/services/postService.test.ts`

Expected: PASS

- [ ] **Step 5: 提交博客 service 对齐**

```bash
git add src/services/postService.ts src/services/postService.test.ts src/features/post/composables/usePostsStore.ts
git commit -m "feat: map backend blogs into frontend post models"
```

## Task 4: 对齐个人资料 service，并静默隐藏假活动与关系摘要

**Files:**
- Modify: `src/services/profileService.ts`
- Modify: `src/services/profileService.test.ts`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/AboutView.test.ts`

- [ ] **Step 1: 先写失败测试，锁定 profile envelope 和灰度静默**

```ts
import aboutSource from './AboutView.vue?raw'

describe('profileService backend mode', () => {
  it('unwraps /users/me envelopes in real mode', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api/v1')
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    setSession('alice@example.com')

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: 'Success',
            data: {
              id: 'user-1',
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              bio: 'Alice bio',
              created_at: '2026-04-01T00:00:00.000Z',
              last_login_at: '2026-04-06T00:00:00.000Z',
              visibility: 'public',
            },
            timestamp: '2026-04-06T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(profileService.getProfile()).resolves.toEqual(
      expect.objectContaining({
        username: 'alice',
        displayName: 'Alice',
        bio: 'Alice bio',
      }),
    )
  })
})

describe('About view source contract', () => {
  it('keeps unsupported profile activity and relationship sections behind silent gates', () => {
    expect(aboutSource).toContain('const showProfileActivity = runtimeCapabilities.profileActivity')
    expect(aboutSource).toContain('const showRelationshipSummary = runtimeCapabilities.relationshipSummary')
    expect(aboutSource).toContain('v-if="showProfileActivity"')
    expect(aboutSource).toContain('v-if="showRelationshipSummary"')
  })
})
```

- [ ] **Step 2: 运行资料页定向测试，确认当前失败**

Run: `npm run test:run -- src/services/profileService.test.ts src/views/AboutView.test.ts`

Expected: FAIL

- [ ] **Step 3: 实现资料 service 解包与 AboutView 静默门禁**

```ts
// src/services/profileService.ts
import { apiFetchData } from '@/services/apiClient'

async function getProfile(): Promise<UserProfile> {
  const session = requireAuthSession('请先登录后再查看个人资料')

  if (!isMockMode()) {
    const profile = await apiFetchData<BackendUserProfile>('/users/me', {
      method: 'POST',
      body: JSON.stringify({ user_id: session.user.id }),
    })

    return mapBackendProfile(profile)
  }
}
```

```ts
// src/views/AboutView.vue
import { runtimeCapabilities } from '@/features/runtime/capabilities'

const showProfileActivity = runtimeCapabilities.profileActivity
const showRelationshipSummary = runtimeCapabilities.relationshipSummary
```

```vue
<div v-if="showRelationshipSummary" class="profile-hero__relationship" aria-label="关注摘要">
  <span
    v-for="item in relationshipMetrics"
    :key="item.label"
    class="profile-hero__relationship-item"
  >
    <span>{{ item.label }}</span>
    <strong>{{ item.value }}</strong>
  </span>
</div>

<article v-if="showProfileActivity" class="panel section-card">
  <!-- 保留现有活动流结构，但默认不对真实用户渲染 -->
</article>
```

- [ ] **Step 4: 重新运行资料页定向测试**

Run: `npm run test:run -- src/services/profileService.test.ts src/views/AboutView.test.ts`

Expected: PASS

- [ ] **Step 5: 提交个人资料对齐与灰度静默**

```bash
git add src/services/profileService.ts src/services/profileService.test.ts src/views/AboutView.vue src/views/AboutView.test.ts
git commit -m "feat: quiet unsupported profile surfaces"
```

## Task 5: 收口写作页真实发布边界并锁定详情页无灰度入口

**Files:**
- Modify: `src/views/Write.vue`
- Test: `src/views/Write.test.ts`
- Test: `src/components/Article.test.ts`

- [ ] **Step 1: 先写失败测试，锁定真实用户不再看到灰度功能入口**

```ts
import writeSource from './Write.vue?raw'
import articleSource from '@/components/Article.vue?raw'

describe('Write view backend-first contract', () => {
  it('keeps publish controls limited to backend-supported status and visibility', () => {
    expect(writeSource).toContain(':status="publishStatus"')
    expect(writeSource).toContain(':visibility="publishVisibility"')
    expect(writeSource).not.toContain('tags: selectedTags.value')
    expect(writeSource).not.toContain('coverImage: coverPreviewUrl.value')
  })
})

describe('Article source contract', () => {
  it('does not expose comment, report, or like surfaces in the first backend phase', () => {
    expect(articleSource).not.toContain('CommentSection')
    expect(articleSource).not.toContain('点赞文章')
    expect(articleSource).not.toContain('举报文章')
  })
})
```

- [ ] **Step 2: 运行页面定向测试，确认当前失败或需要收口**

Run: `npm run test:run -- src/views/Write.test.ts src/components/Article.test.ts`

Expected: 如果已有页面仍暴露灰度内容则 FAIL；如果已满足条件则继续下一步实现并补上缺失门禁。

- [ ] **Step 3: 实施写作发布边界收口**

```ts
// src/views/Write.vue
const createdPost = await createPost({
  title: finalTitle,
  markdown: content,
  html,
  status: publishStatus.value,
  visibility: publishVisibility.value,
})
```

```ts
// src/components/Article.vue
// 详情页继续只渲染标题、摘要、作者、日期和正文，不引入评论 / 举报 / 点赞入口
```

- [ ] **Step 4: 重新运行页面定向测试**

Run: `npm run test:run -- src/views/Write.test.ts src/components/Article.test.ts`

Expected: PASS

- [ ] **Step 5: 提交页面主链路收口**

```bash
git add src/views/Write.vue src/views/Write.test.ts src/components/Article.test.ts
git commit -m "feat: narrow visible publish capabilities"
```

## Task 6: 全量验证与视觉回归

**Files:**
- Runtime only: no source changes expected

- [ ] **Step 1: 运行完整测试与类型检查**

Run: `npm run test:run`

Expected: PASS

Run: `npm run type-check`

Expected: PASS

- [ ] **Step 2: 运行构建作为运行态验证**

Run: `npm run build`

Expected: exit 0；允许保留现有 chunk size warning，但不能有构建失败

- [ ] **Step 3: 启动预览并做视觉回归**

Run: `npm run preview -- --host 127.0.0.1 --port 4173`

Expected: 本地可访问 `http://127.0.0.1:4173`

检查面：
- 首页：desktop/light、desktop/dark、mobile/light、mobile/dark
- 登录页：desktop/light、mobile/dark
- 注册页：desktop/light、mobile/dark
- 文章列表：desktop/light、desktop/dark、mobile/light、mobile/dark
- 文章详情：desktop/light、mobile/dark
- 写作页：desktop/light、desktop/dark、mobile/light、mobile/dark
- 个人中心：desktop/light、mobile/dark
- 我的文章：desktop/light、mobile/dark

重点观察：
- 真实后端数据是否正常渲染
- 未支持灰度内容是否对真实用户不可见
- 深色模式是否无明显割裂
- 移动端导航和写作页材质层级是否仍然稳定

- [ ] **Step 4: 记录并汇报验证结果**

最终汇报必须明确写出：
- 跑过的命令
- 命令是否通过
- 做过的视觉回归页面与模式
- 仍然存在的后端缺口或灰度能力

- [ ] **Step 5: 提交最终接入结果**

```bash
git add src/types/api.ts src/types/backend.ts src/features/runtime/capabilities.ts src/features/runtime/capabilities.test.ts src/services/apiClient.ts src/services/apiClient.test.ts src/features/auth/stores/useAuthStore.ts src/features/auth/stores/useAuthStore.test.ts src/main.ts src/services/postService.ts src/services/postService.test.ts src/features/post/composables/usePostsStore.ts src/services/profileService.ts src/services/profileService.test.ts src/views/AboutView.vue src/views/AboutView.test.ts src/views/Write.vue src/views/Write.test.ts src/components/Article.test.ts
git commit -m "feat: integrate backend-first frontend flow"
```
