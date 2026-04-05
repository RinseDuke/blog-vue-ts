<!-- 我的文章管理页：查看/删除已发布文章、查看/清空本地草稿 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { DraftPayload } from '@/features/post/composables/useDraft'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useDraft } from '@/features/post/composables/useDraft'
import type { Post } from '@/types/post'
import { formatPostDate, toPlainText } from '@/features/post/utils/post'
import PostCard from '@/components/post/PostCard.vue'
import { deletePost, fetchUserPosts } from '@/services/postService'

const authStore = useAuthStore()
const { readDraft, clearPersistedDraft } = useDraft()
const userEmail = computed(() => authStore.userEmail)
const userId = computed(() => authStore.userId)

const currentDraft = ref<DraftPayload | null>(null)
const managedPosts = ref<Post[]>([])
const loading = ref(false)
const error = ref('')
const deletingPostId = ref('')
const actionMessage = ref('')
const actionError = ref('')

const totalReadMinutes = computed(() =>
  managedPosts.value.reduce((sum, post) => sum + post.readMinutes, 0)
)

const latestPublishedLabel = computed(() =>
  managedPosts.value[0] ? formatPostDate(managedPosts.value[0].publishedAt) : '暂无发布记录'
)

const summaryCards = computed(() => [
  { label: '已发布', value: managedPosts.value.length, helper: '当前账号的文章' },
  { label: '草稿', value: currentDraft.value ? 1 : 0, helper: currentDraft.value ? '可继续编辑' : '暂无草稿' },
  { label: '阅读时长', value: `${totalReadMinutes.value} 分钟`, helper: '按文章预计时长' },
  { label: '最近发布', value: latestPublishedLabel.value, helper: '最近一次发布时间' },
])

const draftPreview = computed(() => {
  if (!currentDraft.value?.markdown) return ''

  const preview = toPlainText(currentDraft.value.markdown)

  if (!preview) return '当前草稿还没有正文内容。'
  return preview.length > 110 ? `${preview.slice(0, 110).trim()}...` : preview
})

function refreshDraft() {
  currentDraft.value = readDraft()
}

async function loadManagedPosts() {
  if (!userId.value) {
    managedPosts.value = []
    return
  }

  loading.value = true
  error.value = ''

  try {
    managedPosts.value = await fetchUserPosts(userId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文章失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

async function handleDeletePost(postId: string) {
  if (deletingPostId.value) return
  if (!window.confirm('确定要删除这篇已发布文章吗？该操作不可撤销。')) return

  deletingPostId.value = postId
  actionMessage.value = ''
  actionError.value = ''

  try {
    await deletePost(postId)
    await loadManagedPosts()
    actionMessage.value = '文章已删除。'
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : '删除文章失败，请稍后重试。'
  } finally {
    deletingPostId.value = ''
  }
}

function handleClearDraft() {
  if (!currentDraft.value) return
  if (!window.confirm('确定要清空当前草稿吗？此操作不可撤销。')) return

  clearPersistedDraft()
  refreshDraft()
  actionMessage.value = '草稿已清空。'
  actionError.value = ''
}

onMounted(async () => {
  refreshDraft()
  await loadManagedPosts()
})
</script>

<template>
  <section class="manager-page">
    <div class="manager-page__inner">
      <header class="manager-hero">
        <div>
          <p class="manager-hero__eyebrow">内容管理</p>
          <h1>我的文章</h1>
          <p class="manager-hero__hint">集中管理当前账号的已发布文章和本地草稿，文章卡片复用了站内现有展示组件。</p>
        </div>

        <div class="manager-hero__actions">
          <RouterLink to="/write" class="manager-btn manager-btn--primary">写新文章</RouterLink>
          <RouterLink to="/about" class="manager-btn">返回个人中心</RouterLink>
        </div>
      </header>

      <section class="manager-stats">
        <article v-for="item in summaryCards" :key="item.label" class="stat-card">
          <p class="stat-card__value">{{ item.value }}</p>
          <p class="stat-card__label">{{ item.label }}</p>
          <p class="stat-card__helper">{{ item.helper }}</p>
        </article>
      </section>

      <p v-if="actionMessage" class="manager-feedback manager-feedback--success">{{ actionMessage }}</p>
      <p v-if="actionError" class="manager-feedback manager-feedback--error">{{ actionError }}</p>

      <div class="manager-layout">
        <section class="manager-main">
          <article class="panel draft-panel">
            <header class="section-head">
              <div>
                <p class="section-head__eyebrow">草稿</p>
                <h2>当前草稿</h2>
              </div>
              <RouterLink v-if="currentDraft" to="/write" class="section-head__link">继续编辑</RouterLink>
            </header>

            <div v-if="currentDraft" class="draft-panel__body">
              <div class="draft-panel__meta">
                <h3>{{ currentDraft.title || '未命名草稿' }}</h3>
                <p>最后保存于 {{ formatPostDate(currentDraft.updatedAt) }}</p>
              </div>

              <p class="draft-panel__preview">{{ draftPreview }}</p>

              <div class="draft-panel__actions">
                <RouterLink to="/write" class="manager-btn manager-btn--primary">继续写作</RouterLink>
                <button type="button" class="manager-btn manager-btn--danger" @click="handleClearDraft">清空草稿</button>
              </div>
            </div>

            <div v-else class="state-card state-card--empty">
              <p>当前没有可管理的草稿。</p>
              <RouterLink to="/write" class="manager-btn manager-btn--primary">去写第一篇</RouterLink>
            </div>
          </article>

          <article class="panel published-panel">
            <header class="section-head">
              <div>
                <p class="section-head__eyebrow">已发布</p>
                <h2>文章列表</h2>
              </div>
              <span class="section-head__meta">{{ managedPosts.length }} 篇</span>
            </header>

            <div v-if="loading" class="state-card">正在加载你的文章...</div>
            <div v-else-if="error" class="state-card state-card--error">{{ error }}</div>

            <div v-else-if="!managedPosts.length" class="state-card state-card--empty">
              <p>当前账号还没有已发布文章。</p>
              <RouterLink to="/write" class="manager-btn manager-btn--primary">立即发布第一篇</RouterLink>
            </div>

            <div v-else class="post-manager-list">
              <PostCard v-for="post in managedPosts" :key="post.id" :post="post">
                <template #footer-actions="{ post: managedPost }">
                  <div class="manage-post-actions">
                    <RouterLink
                      :to="{ name: 'article-detail', params: { id: managedPost.id } }"
                      class="manage-post-actions__link"
                    >
                      查看文章
                    </RouterLink>
                    <button
                      type="button"
                      class="manage-post-actions__link manage-post-actions__link--danger"
                      :disabled="deletingPostId === managedPost.id"
                      @click="handleDeletePost(managedPost.id)"
                    >
                      {{ deletingPostId === managedPost.id ? '删除中...' : '删除文章' }}
                    </button>
                  </div>
                </template>
              </PostCard>
            </div>
          </article>
        </section>

        <aside class="manager-side">
          <article class="panel side-panel">
            <header class="section-head section-head--side">
              <div>
                <p class="section-head__eyebrow">概览</p>
                <h2>发布状态</h2>
              </div>
            </header>

            <dl class="info-list">
              <div class="info-list__row">
                <dt>当前账号</dt>
                <dd>{{ userEmail || '未登录' }}</dd>
              </div>
              <div class="info-list__row">
                <dt>最近发布</dt>
                <dd>{{ latestPublishedLabel }}</dd>
              </div>
              <div class="info-list__row">
                <dt>草稿状态</dt>
                <dd>{{ currentDraft ? '有未完成草稿' : '暂无草稿' }}</dd>
              </div>
            </dl>
          </article>

        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.manager-page {
  width: 100%;
  padding: 64px 20px 48px;
}

.manager-page__inner {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.manager-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.manager-hero__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.manager-hero h1 {
  margin: 0.3rem 0 0;
  color: var(--ink-strong);
  font-size: clamp(2rem, 3.8vw, 2.8rem);
  letter-spacing: -0.03em;
}

.manager-hero__hint {
  margin: 0.65rem 0 0;
  color: var(--ink-muted);
  max-width: 720px;
}

.manager-hero__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.panel {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, var(--card-top), var(--card-bottom));
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(12px);
}

.manager-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.78rem 1.3rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-strong);
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.manager-btn--primary {
  background: var(--brand-500);
  color: #fff;
  border-color: var(--brand-500);
}

.manager-btn--danger {
  color: var(--danger-500);
  border-color: rgba(198, 40, 40, 0.24);
}

.manager-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.manager-stats {
  margin-top: 1.25rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.stat-card {
  padding: 1rem 1.05rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
}

.stat-card__value {
  margin: 0;
  color: var(--ink-strong);
  font-size: 1.55rem;
  font-weight: 800;
}

.stat-card__label {
  margin: 0.15rem 0 0;
  color: var(--ink-main);
  font-weight: 700;
}

.stat-card__helper {
  margin: 0.28rem 0 0;
  color: var(--ink-muted);
  font-size: 0.82rem;
}

.manager-feedback {
  margin: 1rem 0 0;
  padding: 0.82rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  font-weight: 600;
}

.manager-feedback--success {
  background: var(--success-bg);
  color: var(--success-500);
}

.manager-feedback--error {
  background: var(--danger-bg);
  color: var(--danger-500);
}

.manager-layout {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.85fr);
  gap: 1rem;
  align-items: flex-start;
}

.manager-main,
.manager-side {
  display: grid;
  gap: 1rem;
}

.draft-panel,
.published-panel,
.side-panel {
  padding: 1.3rem;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-head--side {
  margin-bottom: 0.85rem;
}

.section-head__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-head h2 {
  margin: 0.25rem 0 0;
  color: var(--ink-strong);
  font-size: clamp(1.3rem, 2.4vw, 1.65rem);
}

.section-head__link,
.section-head__meta {
  color: var(--ink-muted);
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
}

.draft-panel__body {
  display: grid;
  gap: 0.9rem;
}

.draft-panel__meta h3 {
  margin: 0;
  color: var(--ink-strong);
  font-size: 1.2rem;
}

.draft-panel__meta p,
.draft-panel__preview {
  margin: 0.3rem 0 0;
  color: var(--ink-muted);
  line-height: 1.68;
}

.draft-panel__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.state-card {
  padding: 1.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: var(--surface);
  color: var(--ink-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  text-align: center;
}

.state-card--error {
  background: var(--danger-bg);
  color: var(--danger-500);
}

.state-card--empty {
  background: var(--bg-canvas-soft);
  color: var(--ink-main);
}

.post-manager-list {
  display: grid;
  gap: 1rem;
}

.manage-post-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.manage-post-actions__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.42rem 0.82rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--brand-500);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.manage-post-actions__link--danger {
  color: var(--danger-500);
  border-color: rgba(198, 40, 40, 0.24);
}

.manage-post-actions__link:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.info-list {
  display: grid;
  gap: 0.7rem;
}

.info-list__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.7rem;
  border-top: 1px dashed var(--line-soft);
}

.info-list__row dt,
.info-list__row dd {
  margin: 0;
}

.info-list__row dt {
  color: var(--ink-muted);
}

.info-list__row dd {
  color: var(--ink-strong);
  text-align: right;
  font-weight: 600;
}

@media (max-width: 980px) {
  .manager-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .manager-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .manager-page {
    padding: 40px 14px 40px;
  }

  .manager-stats {
    grid-template-columns: 1fr;
  }

  .manager-hero__actions,
  .draft-panel__actions {
    width: 100%;
  }

  .manager-btn {
    flex: 1;
  }
}
</style>
