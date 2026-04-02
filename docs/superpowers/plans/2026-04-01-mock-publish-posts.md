# Mock 模式发文与展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 mock 模式下从 `write` 页发布的文章能够写入本地持久化存储，并在首页、文章列表、文章详情页立即可见且刷新后仍可见。

**Architecture:** 继续把 `src/services/postService.ts` 作为 mock 文章的唯一数据入口。实现集中在 service 层：统一读取内置 `mockPosts` 与 `localStorage` 已发布文章的合并结果，保证列表查询、详情查询和发布写回都走同一套去重与可见性规则；页面层继续沿用现有 `createPost()`、`postsStore.refreshPosts()` 与详情跳转链路，只在运行校验证明确实有阻断时才做最小页面补丁。

**Tech Stack:** Vue 3、TypeScript、Pinia、Vite、Vitest、localStorage mock persistence

---

## File Structure

- `src/services/postService.ts`
  - 负责 mock / real 模式下的文章读写。
  - 这次要把“内置文章 + 本地已发布文章”的合并、去重、持久化回退逻辑收敛到这里。
- `src/services/postService.test.ts`
  - 负责锁定 mock 发文回归行为。
  - 现有测试已经覆盖创建、删除、可见性；这次补齐“本地优先去重”和“损坏存储回退”的缺口。
- `src/views/Write.vue`
  - 只作为运行验收面。
  - 默认不改；只有在运行校验时发现 `createPost()` 后的刷新或跳详情链路仍阻断，才做最小修正。

### Task 1: 补齐缺失的 mock 合并回归测试

**Files:**
- Modify: `src/services/postService.test.ts`
- Test: `src/services/postService.test.ts`

- [ ] **Step 1: 写失败测试，锁定“本地持久化文章与内置 mock 文章冲突时去重且本地优先”**

```ts
const AUTH_KEY = 'blog_auth_session_v1'
const PUBLISHED_POSTS_KEY = 'blog_published_posts_v1'

it('keeps only one post when a persisted mock post collides with a seeded post id', async () => {
  const seededPost = structuredClone(mockPosts[0])

  localStorage.setItem(
    PUBLISHED_POSTS_KEY,
    JSON.stringify([
      {
        ...seededPost,
        title: '本地覆盖版标题',
        excerpt: '本地覆盖版摘要',
        content: '<p>本地覆盖版正文</p>',
        publishedAt: '2026-04-01T08:00:00.000Z',
      },
    ]),
  )

  const posts = await fetchPosts()
  const collidedPosts = posts.filter((post) => post.id === seededPost.id)

  expect(collidedPosts).toHaveLength(1)
  expect(collidedPosts[0]).toEqual(
    expect.objectContaining({
      id: seededPost.id,
      title: '本地覆盖版标题',
      excerpt: '本地覆盖版摘要',
    }),
  )

  await expect(fetchPostById(seededPost.id)).resolves.toEqual(
    expect.objectContaining({
      id: seededPost.id,
      title: '本地覆盖版标题',
    }),
  )
})
```

- [ ] **Step 2: 写通过性回归测试，锁定“损坏存储时安全回退到内置文章”**

```ts
it('falls back to seeded mock posts when persisted storage is corrupted', async () => {
  localStorage.setItem(PUBLISHED_POSTS_KEY, '{"broken":true}')

  const posts = await fetchPosts()

  expect(posts.length).toBeGreaterThan(0)
  expect(posts.some((post) => post.id === mockPosts[0]?.id)).toBe(true)
})
```

- [ ] **Step 3: 运行定向测试，确认新的去重断言先失败**

Run: `npm run test:run -- src/services/postService.test.ts`

Expected: FAIL，`keeps only one post when a persisted mock post collides with a seeded post id` 失败，因为当前实现会把本地文章和内置文章同时返回。

- [ ] **Step 4: 重新运行定向测试，确认失败只来自待实现的去重行为**

Run: `npm run test:run -- src/services/postService.test.ts`

Expected: FAIL，失败点集中在新增的 mock 去重断言，而不是测试基座或环境 mock 本身。

- [ ] **Step 5: 提交测试基线**

```bash
git add src/services/postService.test.ts
git commit -m "test: lock mock merge behavior"
```

### Task 2: 在 postService 内统一 mock 合并、去重与持久化入口

**Files:**
- Modify: `src/services/postService.ts`
- Test: `src/services/postService.test.ts`

- [ ] **Step 1: 增加统一的 mock 合并 helper，让本地文章优先且按 id / slug 去重**

```ts
function mergeMockPosts(storedPosts: Post[], seededPosts: Post[]) {
  const merged: Post[] = []
  const seenIds = new Set<string>()
  const seenSlugs = new Set<string>()

  for (const post of [...storedPosts, ...seededPosts]) {
    if (seenIds.has(post.id) || seenSlugs.has(post.slug)) continue
    seenIds.add(post.id)
    seenSlugs.add(post.slug)
    merged.push(post)
  }

  return merged.sort(sortByPublishedAtDesc)
}

function getAllPosts() {
  return mergeMockPosts(readPublishedPosts(), mockPosts)
}
```

- [ ] **Step 2: 让持久化写回与读取使用同一套合法化逻辑**

```ts
function readPublishedPosts(): Post[] {
  try {
    const raw = localStorage.getItem(PUBLISHED_POSTS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isStoredPost)
  } catch {
    return []
  }
}

function persistPublishedPosts(posts: Post[]) {
  const normalizedPosts = mergeMockPosts(posts, [])
  localStorage.setItem(PUBLISHED_POSTS_KEY, JSON.stringify(normalizedPosts))
}
```

- [ ] **Step 3: 确认 mock 下发布、列表查询、详情查询都只走合并后的结果**

```ts
export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  if (isMockMode()) {
    await networkDelay()
    let result = getAllPosts().filter(isPublicPublishedPost)

    if (params.featuredOnly) {
      result = result.filter((post) => post.featured)
    }

    if (params.authorId) {
      result = result.filter((post) => post.author.id === params.authorId)
    }

    if (params.search) {
      const keyword = params.search.trim().toLowerCase()
      result = result.filter((post) =>
        [post.title, post.excerpt, post.author.name].join(' ').toLowerCase().includes(keyword),
      )
    }

    if (params.limit) {
      result = result.slice(0, params.limit)
    }

    return structuredClone(result)
  }

  // real API 保持不变
}

export async function fetchPostById(id: string): Promise<Post | undefined> {
  if (isMockMode()) {
    await networkDelay()
    const post = getAllPosts().find((item) => item.id === id || item.slug === id)
    if (!post || !canReadMockPost(post)) return undefined
    return structuredClone(post)
  }

  // real API 保持不变
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  if (isMockMode()) {
    await networkDelay(250)
    const session = requireAuthSession('请先登录后再发布文章')
    const existingPosts = getAllPosts()
    const storedPosts = readPublishedPosts()
    const publishedAt = new Date().toISOString()

    const nextPost: Post = {
      id: `user-post-${Date.now()}`,
      slug: buildSlug(payload.title, new Set(existingPosts.map((post) => post.slug))),
      title: payload.title.trim(),
      excerpt: buildExcerpt(payload.markdown || payload.html) || '新发布的文章',
      coverImage: payload.coverImage || undefined,
      content: payload.html,
      tags: Array.from(new Set((payload.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      author: buildAuthor(session.user.id, session.email, session.user.nickname, session.user.username),
      publishedAt,
      updatedAt: publishedAt,
      readMinutes: estimateReadMinutes(payload.markdown),
      featured: false,
      likes: 0,
      status: payload.status ?? 'published',
      visibility: payload.visibility ?? 'public',
    }

    persistPublishedPosts([nextPost, ...storedPosts])
    return structuredClone(nextPost)
  }

  // real API 保持不变
}
```

- [ ] **Step 4: 运行定向测试，确认 mock 服务行为通过**

Run: `npm run test:run -- src/services/postService.test.ts`

Expected: PASS，新增的去重回归用例、损坏回退用例，以及原有 mock auth / create / delete / visibility 用例全部通过。

- [ ] **Step 5: 提交 service 改动**

```bash
git add src/services/postService.ts src/services/postService.test.ts
git commit -m "feat: unify mock post merge behavior"
```

### Task 3: 做运行校验、类型检查与视觉回归

**Files:**
- Modify: `src/views/Write.vue`（仅当运行校验发现现有刷新或跳详情链路仍阻断时）
- Verify: `src/services/postService.ts`
- Verify: `src/services/postService.test.ts`
- Verify: `src/views/Write.vue`
- Verify: `src/views/HomeView.vue`
- Verify: `src/views/ArticleListView.vue`
- Verify: `src/components/Article.vue`

- [ ] **Step 1: 运行项目并用 mock 链路手动发布一篇文章**

Run: `npm run dev`

Expected: Vite 本地开发服务启动成功，可在浏览器进入 `write` 页、登录 mock 账号、发布文章。

- [ ] **Step 2: 按实际用户路径做运行验收**

```text
1. 进入登录页，使用 mock 登录。
2. 进入 write 页，填写标题与正文，保持“发布 / 公开”默认值。
3. 点击发布，确认跳转到文章详情页且正文正常显示。
4. 返回首页，确认“最新文章”出现新文章。
5. 进入文章列表，确认新文章出现在列表顶部或符合排序结果。
6. 刷新首页、列表页、详情页，确认文章仍然存在。
```

- [ ] **Step 3: 若发布后页面仍未展示，补最小页面修正**

```ts
await postsStore.refreshPosts().catch((err) => {
  console.warn('发布后刷新文章缓存失败', err)
})
await router.replace({ name: 'article-detail', params: { id: createdPost.id } })
```

只有当 `src/views/Write.vue` 现有逻辑没有正确触发刷新或跳转时，才修改这里；否则保持页面层不变。

- [ ] **Step 4: 运行类型检查与最近似运行校验**

Run: `npm run type-check`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: 完成视觉回归并记录受检页面**

```text
必查页面：
- write 发布页
- 首页最新文章区
- 文章列表页
- 文章详情页

必查状态：
- light / dark
- desktop / mobile
- 发布成功后的详情跳转
- 刷新后的列表与详情保留
```

- [ ] **Step 6: 提交最终补丁（如果 Task 3 产生了页面修正）**

```bash
git add src/views/Write.vue
git commit -m "fix: keep mock publish flow visible in write"
```

如果 Task 3 没有页面改动，这一步跳过。
