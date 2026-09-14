# 认证密码存储修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 阻止模拟认证密码进入任何浏览器存储，同时保持模拟注册、登录、会话恢复和正式后端认证行为稳定。

**Architecture:** 模拟账号改为每个认证状态实例内的内存集合，不再持久化凭据。会话的构造、读取和保存都通过公开字段白名单生成新对象，并在初始化时清除旧模拟账号数据、重写旧会话。

**Tech Stack:** Vue 3、Pinia、TypeScript、Vitest

---

## 文件结构

- `src/features/auth/stores/useAuthStore.ts`（认证状态、模拟账号内存集合、会话字段白名单和旧数据清理）
- `src/features/auth/stores/useAuthStore.test.ts`（密码不落盘、模拟账号当前页面可用及旧数据迁移测试）

### Task 1：先锁定安全边界和现有模拟行为

**Files:**
- Modify: `src/features/auth/stores/useAuthStore.test.ts`
- Test: `src/features/auth/stores/useAuthStore.test.ts`

- [x] **Step 1：新增密码不落盘的失败断言**

在现有注册测试中读取两类浏览器存储，确认没有注册密码，并确认旧的模拟用户存储键不存在：

```ts
const persistedAuth = [
  localStorage.getItem(AUTH_KEY),
  sessionStorage.getItem(AUTH_KEY),
  localStorage.getItem(USERS_KEY),
].filter((value): value is string => value !== null)

expect(persistedAuth.join('\n')).not.toContain('SecurePass123')
expect(localStorage.getItem(USERS_KEY)).toBeNull()
```

- [x] **Step 2：新增旧敏感数据清理的失败测试**

```ts
it('removes legacy stored passwords while restoring a safe session', () => {
  const legacyPassword = 'LegacySecret123'
  localStorage.setItem(USERS_KEY, JSON.stringify([{ password: legacyPassword }]))
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      email: 'legacy@example.com',
      rememberMe: true,
      loggedAt: '2026-01-01T00:00:00.000Z',
      token: 'legacy-token',
      user: {
        id: 'legacy-user',
        username: 'legacy',
        nickname: 'legacy',
        email: 'legacy@example.com',
        visibility: 'public',
        password: legacyPassword,
      },
    })
  )

  const store = useAuthStore()

  expect(localStorage.getItem(USERS_KEY)).toBeNull()
  expect(localStorage.getItem(AUTH_KEY)).not.toContain(legacyPassword)
  expect(JSON.stringify(store.session)).not.toContain(legacyPassword)
})
```

- [x] **Step 3：新增当前页面内重新登录的行为测试**

```ts
it('keeps a newly registered mock account available in the current page', async () => {
  const store = useAuthStore()
  const credentials = {
    username: 'memory_user',
    email: 'memory@example.com',
    password: 'MemoryPass123',
    rememberMe: true,
    visibility: 'public' as const,
  }

  await store.register(credentials)
  store.logout()
  await store.login({
    username: credentials.username,
    password: credentials.password,
    rememberMe: false,
  })

  expect(store.isLoggedIn).toBe(true)
  expect(store.username).toBe(credentials.username)
})
```

- [x] **Step 4：运行测试并确认安全测试按预期失败**

Run: `npm run test:run -- src/features/auth/stores/useAuthStore.test.ts`

Expected: FAIL；密码不落盘测试能看到 `SecurePass123`（测试密码），旧数据清理测试能看到 `LegacySecret123`（旧测试密码）。当前页面内重新登录测试保持通过。

### Task 2：改为内存模拟账号并使用会话字段白名单

**Files:**
- Modify: `src/features/auth/stores/useAuthStore.ts`
- Test: `src/features/auth/stores/useAuthStore.test.ts`

- [x] **Step 1：新增公开用户字段复制函数**

```ts
function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    visibility: user.visibility,
  }
}
```

- [x] **Step 2：让会话构造、读取和保存都使用白名单对象**

`buildSession()`（构造会话）只保存 `toAuthUser(user)`（公开用户字段）；`readStoredAuthSession()`（读取会话）不再展开未知属性；`persistSession()`（保存会话）在序列化前再次复制安全字段。

```ts
const safeSession: AuthSession = {
  ...nextSession,
  user: toAuthUser(nextSession.user),
}
storage.setItem(AUTH_KEY, JSON.stringify(safeSession))
session.value = safeSession
```

- [x] **Step 3：把模拟账号集合移动到认证状态实例内存**

```ts
const registeredUsers = DEFAULT_MOCK_USERS.map((user) => ({ ...user }))
```

模拟登录直接查找该集合；模拟注册完成后使用 `registeredUsers.push(nextUser)`（加入内存集合），删除模拟用户的浏览器读写函数。

- [x] **Step 4：清理旧敏感数据**

认证状态初始化时删除 `USERS_KEY`（旧模拟用户存储键）。发现旧会话含密码字段时，同时删除本地和会话存储中的认证会话，要求用户重新登录；普通安全会话仍可恢复。

- [x] **Step 5：运行认证测试并确认通过**

Run: `npm run test:run -- src/features/auth/stores/useAuthStore.test.ts`

Expected: PASS，现有认证测试和密码不落盘测试全部通过。

### Task 3：完整验证

**Files:**
- Verify: `src/features/auth/stores/useAuthStore.ts`
- Verify: `src/features/auth/stores/useAuthStore.test.ts`

- [x] **Step 1：运行完整测试**

Run: `npm run test:run`

Expected: PASS，无失败测试。

- [x] **Step 2：运行生产构建**

Run: `npm run build`

Expected: PASS，类型检查和生产构建退出码为 0。

- [x] **Step 3：检查敏感字段与改动范围**

Run: `rg -n "setItem\\(USERS_KEY|JSON\\.stringify\\(users\\)" src/features/auth/stores/useAuthStore.ts`

Expected: 无匹配；模拟用户集合不再写入浏览器存储。

Run: `git diff --check -- src/features/auth/stores/useAuthStore.ts src/features/auth/stores/useAuthStore.test.ts`

Expected: 无格式错误，并且只包含本次安全修复相关改动。
