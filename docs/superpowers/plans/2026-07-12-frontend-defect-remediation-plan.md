# Frontend Defect Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复巡检报告中的 10 项前端缺陷，并用自动化测试和浏览器回归证明行为恢复。

**Architecture:** 在现有 Vue 3 组件、Vue Router、Pinia 和服务层内做定点修复。新增公开作者页与 404 页；复用现有评论模块；把筛选状态和创建时间等规则下沉到可测试的纯逻辑；视觉问题继续使用当前编辑部报刊设计令牌。

**Tech Stack:** Vue 3、TypeScript、Vue Router、Pinia、Vitest、Less、agent-browser

---

### Task 1: 公开作者路由与作者页

**Files:**
- Create: `src/views/AuthorView.vue`
- Create: `src/views/AuthorView.test.ts`
- Create: `src/router/index.test.ts`
- Modify: `src/router/index.ts`
- Modify: `src/components/Article.vue`
- Modify: `src/components/Article.test.ts`

- [ ] **Step 1: 写作者链接与路由失败测试**

```ts
// src/components/Article.test.ts
it('links article bylines to the public author route', () => {
  expect(articleSource).toContain(`:to="{ name: 'author', params: { id: post.author.id } }"`)
  expect(articleSource).not.toContain('<router-link to="/about" class="article-hero__meta"')
})

// src/router/index.test.ts
import routerSource from './index.ts?raw'

it('registers the public author route', () => {
  expect(routerSource).toContain("path: '/author/:id'")
  expect(routerSource).toContain("name: 'author'")
  expect(routerSource).toContain("import('../views/AuthorView.vue')")
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/components/Article.test.ts src/router/index.test.ts`

Expected: FAIL，当前作者链接仍是 `/about`，且没有 `author` 路由。

- [ ] **Step 3: 写作者页失败测试**

```ts
// src/views/AuthorView.test.ts
import source from './AuthorView.vue?raw'

describe('AuthorView source contract', () => {
  it('loads public posts for the route author and exposes recovery state', () => {
    expect(source).toContain("fetchPosts({ authorId })")
    expect(source).toContain('作者未找到')
    expect(source).toContain('返回文章列表')
    expect(source).toContain('PostList')
  })
})
```

- [ ] **Step 4: 运行作者页测试并确认失败**

Run: `npm run test:run -- src/views/AuthorView.test.ts`

Expected: FAIL，`AuthorView.vue` 尚不存在。

- [ ] **Step 5: 实现公开作者页和路由**

```ts
// src/router/index.ts routes
{
  path: '/author/:id',
  name: 'author',
  component: () => import('../views/AuthorView.vue'),
},
```

```vue
<!-- src/components/Article.vue -->
<router-link
  :to="{ name: 'author', params: { id: post.author.id } }"
  class="article-hero__meta"
  aria-label="查看作者主页"
>
```

```vue
<!-- src/views/AuthorView.vue 核心逻辑 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Author, Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'
import PostList from '@/components/post/PostList.vue'

const route = useRoute()
const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref('')
const author = computed<Author | null>(() => posts.value[0]?.author ?? null)

async function loadAuthor(authorId: string) {
  loading.value = true
  error.value = ''
  try {
    posts.value = await fetchPosts({ authorId })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '作者资料加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (value) => void loadAuthor(typeof value === 'string' ? value : ''),
  { immediate: true },
)
</script>
```

- [ ] **Step 6: 运行相关测试**

Run: `npm run test:run -- src/components/Article.test.ts src/router/index.test.ts src/views/AuthorView.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/router/index.ts src/router/index.test.ts src/components/Article.vue src/components/Article.test.ts src/views/AuthorView.vue src/views/AuthorView.test.ts
git commit -m "fix: add public author profiles"
```

### Task 2: 恢复评论区和文章错误恢复入口

**Files:**
- Modify: `src/components/Article.vue`
- Modify: `src/components/Article.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('mounts comments for the loaded article', () => {
  expect(articleSource).toContain("import CommentSection from '@/components/comment/CommentSection.vue'")
  expect(articleSource).toContain('<CommentSection :post-id="post.id" />')
})

it('offers a recovery link when the article cannot be loaded', () => {
  expect(articleSource).toContain('article-error')
  expect(articleSource).toContain('返回文章列表')
  expect(articleSource).toMatch(/v-else-if="error"[\s\S]*router-link/)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/components/Article.test.ts`

Expected: FAIL，评论组件未挂载，错误状态只有纯文本。

- [ ] **Step 3: 实现评论区与恢复入口**

```vue
<div v-else-if="error" class="status-message error article-error">
  <p>{{ error }}</p>
  <router-link to="/article" class="back-link">返回文章列表</router-link>
</div>

<div class="article-prose">
  <div class="article-body" v-html="safeHtml"></div>
  <CommentSection :post-id="post.id" />
</div>
```

```ts
import CommentSection from '@/components/comment/CommentSection.vue'
```

- [ ] **Step 4: 运行文章与评论测试**

Run: `npm run test:run -- src/components/Article.test.ts src/features/comment/stores/useCommentStore.test.ts src/services/commentService.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/Article.vue src/components/Article.test.ts
git commit -m "fix: restore article comments and recovery state"
```

### Task 3: 筛选重置覆盖排序和每页数量

**Files:**
- Modify: `src/features/post/utils/articleListQuery.ts`
- Modify: `src/features/post/utils/articleListQuery.test.ts`
- Modify: `src/views/ArticleListView.vue`

- [ ] **Step 1: 写纯逻辑失败测试**

```ts
import { hasNonDefaultArticleListState } from './articleListQuery'

it('treats non-default sort and page size as active state', () => {
  expect(hasNonDefaultArticleListState({
    datePreset: 'all',
    customStartDate: '',
    customEndDate: '',
    keyword: '',
    sortMode: 'oldest',
    pageSize: 6,
  })).toBe(true)

  expect(hasNonDefaultArticleListState({
    datePreset: 'all',
    customStartDate: '',
    customEndDate: '',
    keyword: '',
    sortMode: 'newest',
    pageSize: 12,
  })).toBe(true)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/features/post/utils/articleListQuery.test.ts`

Expected: FAIL，函数尚未导出。

- [ ] **Step 3: 实现默认状态判断并接入页面**

```ts
export interface ArticleListFilterState {
  datePreset: DatePreset
  customStartDate: string
  customEndDate: string
  keyword: string
  sortMode: SortMode
  pageSize: number
}

export function hasNonDefaultArticleListState(state: ArticleListFilterState) {
  return (
    state.datePreset !== 'all' ||
    state.customStartDate !== '' ||
    state.customEndDate !== '' ||
    state.keyword.trim() !== '' ||
    state.sortMode !== 'newest' ||
    state.pageSize !== 6
  )
}
```

```ts
// src/views/ArticleListView.vue
const hasActiveFilters = computed(() =>
  hasNonDefaultArticleListState({
    datePreset: datePreset.value,
    customStartDate: customStartDate.value,
    customEndDate: customEndDate.value,
    keyword: keyword.value,
    sortMode: sortMode.value,
    pageSize: pageSize.value,
  }),
)
```

- [ ] **Step 4: 运行查询与筛选测试**

Run: `npm run test:run -- src/features/post/utils/articleListQuery.test.ts src/components/post/ArticleFilters.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/features/post/utils/articleListQuery.ts src/features/post/utils/articleListQuery.test.ts src/views/ArticleListView.vue
git commit -m "fix: enable reset for all article list state"
```

### Task 4: 移动搜索弹层焦点约束

**Files:**
- Create: `src/components/search/MobileSearchSheet.test.ts`
- Modify: `src/components/search/MobileSearchSheet.vue`

- [ ] **Step 1: 写键盘契约失败测试**

```ts
import source from './MobileSearchSheet.vue?raw'

describe('MobileSearchSheet accessibility contract', () => {
  it('acts as a modal dialog with escape and focus trapping', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('@keydown="handleKeydown"')
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain("event.key !== 'Tab'")
    expect(source).toContain('previousFocus.value?.focus()')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/components/search/MobileSearchSheet.test.ts`

Expected: FAIL，当前组件没有对话框语义和键盘处理。

- [ ] **Step 3: 实现焦点保存、循环与恢复**

```vue
<section
  v-if="open"
  ref="sheetEl"
  class="mobile-search-sheet"
  role="dialog"
  aria-modal="true"
  aria-label="搜索文章"
  data-testid="mobile-search-sheet"
  @keydown="handleKeydown"
>
```

```ts
import { computed, nextTick, ref, watch } from 'vue'

const sheetEl = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

function getFocusableElements() {
  return Array.from(
    sheetEl.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus.value = document.activeElement as HTMLElement | null
      await nextTick()
      inputEl.value?.focus()
      return
    }
    previousFocus.value?.focus()
    previousFocus.value = null
  },
)
```

- [ ] **Step 4: 运行测试**

Run: `npm run test:run -- src/components/search/MobileSearchSheet.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/search/MobileSearchSheet.vue src/components/search/MobileSearchSheet.test.ts
git commit -m "fix: trap focus in mobile search"
```

### Task 5: 404 页面和未知路由

**Files:**
- Create: `src/views/NotFoundView.vue`
- Create: `src/views/NotFoundView.test.ts`
- Modify: `src/router/index.ts`
- Modify: `src/router/index.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// src/router/index.test.ts
it('registers a catch-all not found route last', () => {
  expect(routerSource).toContain("path: '/:pathMatch(.*)*'")
  expect(routerSource).toContain("name: 'not-found'")
  expect(routerSource).toContain("import('../views/NotFoundView.vue')")
})

// src/views/NotFoundView.test.ts
import source from './NotFoundView.vue?raw'

it('renders recovery actions', () => {
  expect(source).toContain('页面不存在')
  expect(source).toContain('返回首页')
  expect(source).toContain('浏览文章')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/router/index.test.ts src/views/NotFoundView.test.ts`

Expected: FAIL，通配路由和页面尚不存在。

- [ ] **Step 3: 实现页面和最后一条通配路由**

```ts
{
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('../views/NotFoundView.vue'),
},
```

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1>页面不存在</h1>
    <p>没有找到“{{ route.fullPath }}”对应的内容。</p>
    <div class="not-found__actions">
      <RouterLink to="/">返回首页</RouterLink>
      <RouterLink to="/article">浏览文章</RouterLink>
    </div>
  </section>
</template>
```

- [ ] **Step 4: 运行测试**

Run: `npm run test:run -- src/router/index.test.ts src/views/NotFoundView.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/router/index.ts src/router/index.test.ts src/views/NotFoundView.vue src/views/NotFoundView.test.ts
git commit -m "fix: add not found recovery page"
```

### Task 6: 注册协议、真实创建时间与默认资料

**Files:**
- Modify: `src/views/RegisterView.vue`
- Modify: `src/views/RegisterView.test.ts`
- Modify: `src/features/auth/stores/useAuthStore.ts`
- Modify: `src/features/auth/stores/useAuthStore.test.ts`
- Modify: `src/services/profileService.ts`
- Modify: `src/services/profileService.test.ts`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/AboutView.test.ts`

- [ ] **Step 1: 写注册协议失败测试**

```ts
it('requires active consent instead of preselecting the agreement', () => {
  expect(source).toContain("const acceptedTerms = ref(false)")
  expect(source).not.toContain("const acceptedTerms = ref(true)")
})
```

- [ ] **Step 2: 写创建时间与资料失败测试**

```ts
// src/features/auth/stores/useAuthStore.test.ts
it('keeps the registration timestamp on the session user', async () => {
  const before = Date.now()
  await store.register({
    username: 'fresh_user',
    email: 'fresh@example.com',
    password: 'Password123',
    rememberMe: true,
  })
  expect(new Date(store.session?.user.createdAt ?? '').getTime()).toBeGreaterThanOrEqual(before)
})

// src/services/profileService.test.ts
it('uses the session user creation time for mock profiles', async () => {
  const profile = await profileService.getProfile()
  expect(profile.joinedAt).toBe('2026/07/12')
})
```

```ts
// src/views/AboutView.test.ts
it('does not ship fixed relationship or join data', () => {
  expect(source).not.toContain("joinedAt: '2024/05/12'")
  expect(source).toContain("{ label: '关注', value: 0 }")
})
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `npm run test:run -- src/views/RegisterView.test.ts src/features/auth/stores/useAuthStore.test.ts src/services/profileService.test.ts src/views/AboutView.test.ts`

Expected: FAIL，协议默认 true，`AuthUser` 未保存创建时间，资料仍有固定日期与关注数。

- [ ] **Step 4: 贯通 createdAt 并修正默认值**

```ts
export interface AuthUser {
  id: string
  username: string
  nickname: string
  email: string
  createdAt?: string
  avatar?: string
  bio?: string
  visibility: 'public' | 'private'
}
```

```ts
// 注册 mock 用户时
const createdAt = new Date().toISOString()
const registeredUser: RegisteredUser = {
  id: `user-${normalizedUsername}`,
  username: normalizedUsername,
  nickname: normalizedUsername,
  email: normalizedEmail,
  password,
  createdAt,
  visibility,
}
```

```ts
// mapBackendUser / readStoredAuthSession
createdAt: user.created_at ?? undefined,
```

```ts
// src/services/profileService.ts
joinedAt: formatProfileDate(session.user.createdAt ?? session.loggedAt),
```

```ts
// src/views/RegisterView.vue
const acceptedTerms = ref(false)
```

```ts
// src/views/AboutView.vue
joinedAt: '未记录',
const relationshipMetrics = [
  { label: '关注', value: 0 },
  { label: '粉丝', value: 0 },
]
```

- [ ] **Step 5: 运行认证与资料测试**

Run: `npm run test:run -- src/views/RegisterView.test.ts src/features/auth/stores/useAuthStore.test.ts src/services/profileService.test.ts src/views/AboutView.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/views/RegisterView.vue src/views/RegisterView.test.ts src/features/auth/stores/useAuthStore.ts src/features/auth/stores/useAuthStore.test.ts src/services/profileService.ts src/services/profileService.test.ts src/views/AboutView.vue src/views/AboutView.test.ts
git commit -m "fix: use real account creation data"
```

### Task 7: 移除页脚占位入口

**Files:**
- Create: `src/components/navigation/TopFooter.test.ts`
- Modify: `src/components/navigation/TopFooter.vue`

- [ ] **Step 1: 写失败测试**

```ts
import source from './TopFooter.vue?raw'

describe('TopFooter source contract', () => {
  it('only renders working destinations', () => {
    expect(source).not.toContain('href="#"')
    expect(source).not.toContain('>文档<')
    expect(source).not.toContain('>API<')
    expect(source).not.toContain('class="footer__social"')
    expect(source).toContain('<RouterLink to="/">首页</RouterLink>')
    expect(source).toContain('<RouterLink to="/article">文章</RouterLink>')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/components/navigation/TopFooter.test.ts`

Expected: FAIL，当前存在五个 `#` 占位入口。

- [ ] **Step 3: 删除资源列和社交链接并平衡布局**

```vue
<div class="footer__columns">
  <div class="footer__column">
    <h3 class="footer__title">关于</h3>
    <ul class="footer__links">
      <li><RouterLink to="/about">个人中心</RouterLink></li>
    </ul>
  </div>
  <div class="footer__column">
    <h3 class="footer__title">导航</h3>
    <ul class="footer__links">
      <li><RouterLink to="/">首页</RouterLink></li>
      <li><RouterLink to="/article">文章</RouterLink></li>
      <li><RouterLink to="/write">写作</RouterLink></li>
    </ul>
  </div>
</div>
```

```less
.footer__columns {
  grid-template-columns: repeat(2, minmax(140px, 1fr));
}
```

- [ ] **Step 4: 运行测试**

Run: `npm run test:run -- src/components/navigation/TopFooter.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/navigation/TopFooter.vue src/components/navigation/TopFooter.test.ts
git commit -m "fix: remove placeholder footer links"
```

### Task 8: 首页摘要与主题对比度

**Files:**
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/HomeView.test.ts`
- Modify: `src/assets/base.css`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/AboutView.test.ts`

- [ ] **Step 1: 写首页摘要与资料头部失败测试**

```ts
// src/views/HomeView.test.ts
it('keeps the lead excerpt in a single readable column', () => {
  expect(source).not.toContain('column-count: 2')
  expect(source).toMatch(/\.lead__excerpt \{[\s\S]*max-width: 62ch;/)
})

// src/views/AboutView.test.ts
it('uses high contrast text on the profile banner', () => {
  expect(source).toMatch(/\.profile-hero__identity[\s\S]*color: var\(--profile-hero-text\);/)
})
```

- [ ] **Step 2: 写主题令牌失败测试**

```ts
// src/components/navigation/topHeaderLayout.test.ts 中增加
it('keeps dark muted text readable and defines profile hero contrast tokens', () => {
  expect(baseCssSource).toContain('--profile-hero-text: #fff8eb;')
  expect(baseCssSource).toContain('--profile-hero-muted: rgba(255, 248, 235, 0.78);')
  expect(baseCssSource).toMatch(/:root\[data-theme='dark'\][\s\S]*--ink-muted: #b8ac98;/)
})
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `npm run test:run -- src/views/HomeView.test.ts src/views/AboutView.test.ts src/components/navigation/topHeaderLayout.test.ts`

Expected: FAIL，首页仍使用双栏摘要，资料头部与暗色弱化文字缺少高对比令牌。

- [ ] **Step 4: 调整摘要和颜色令牌**

```less
// src/views/HomeView.vue
.lead__excerpt {
  max-width: 62ch;
  column-count: 1;
  column-gap: 0;
  line-height: 1.65;
}
```

```css
/* src/assets/base.css */
:root {
  --profile-hero-text: #fff8eb;
  --profile-hero-muted: rgba(255, 248, 235, 0.78);
}

:root[data-theme='dark'] {
  --ink-main: #e2d8c8;
  --ink-muted: #b8ac98;
}
```

```less
// src/views/AboutView.vue
.profile-hero__identity,
.profile-hero__identity h1 {
  color: var(--profile-hero-text);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.48);
}

.profile-hero__handle,
.profile-hero__meta {
  color: var(--profile-hero-muted);
}
```

- [ ] **Step 5: 运行视觉契约测试**

Run: `npm run test:run -- src/views/HomeView.test.ts src/views/AboutView.test.ts src/components/navigation/topHeaderLayout.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/views/HomeView.vue src/views/HomeView.test.ts src/assets/base.css src/views/AboutView.vue src/views/AboutView.test.ts src/components/navigation/topHeaderLayout.test.ts
git commit -m "fix: improve editorial layout contrast"
```

### Task 9: 全量验证和浏览器回归

**Files:**
- Modify: `dogfood-output/report.md`
- Create: `dogfood-output/screenshots/fixed-*.png`

- [ ] **Step 1: 运行全部自动化验证**

Run: `npm run lint`

Expected: exit 0，无错误。

Run: `npm run test:run`

Expected: 所有测试文件和测试项通过。

Run: `npm run build`

Expected: TypeScript 类型检查和 Vite 生产构建均 exit 0。

- [ ] **Step 2: 启动生产预览**

Run: `npm run preview -- --host 127.0.0.1 --port 4173`

Expected: `http://127.0.0.1:4173` 可访问。

- [ ] **Step 3: 桌面端回归**

使用 1440×900 检查：

1. 首页摘要按自然顺序换行，暗色模式弱化文字清晰。
2. `/article/1` 显示评论区，作者入口进入 `/author/author-1`。
3. `/article?sort=oldest` 的重置按钮可用。
4. `/not-found-test` 显示 404 恢复页面。
5. 新注册用户加入日期为当天，关注数为 0，资料头部文字清晰。
6. 页脚没有占位链接。

- [ ] **Step 4: 移动端回归**

使用 390×844 检查：

1. 搜索弹层 Escape 可关闭。
2. Tab 与 Shift+Tab 不离开弹层。
3. 关闭后焦点回到搜索按钮。
4. 注册页协议默认未勾选。
5. 作者页、评论区和 404 页面无横向溢出。

- [ ] **Step 5: 更新巡检报告**

将 `dogfood-output/report.md` 中每个问题增加“已修复”和验证证据路径，保留原问题描述作为回归记录。

- [ ] **Step 6: 提交验证证据**

```bash
git add dogfood-output/report.md dogfood-output/screenshots
git commit -m "test: verify frontend defect remediation"
```
