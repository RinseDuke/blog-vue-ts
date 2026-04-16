<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useDraft, type DraftPayload } from '@/features/post/composables/useDraft'
import { usePostsStore } from '@/features/post/composables/usePostsStore'
import { formatPostDate, toPlainText } from '@/features/post/utils/post'
import { profileService, type UserProfile } from '@/services/profileService'

const authStore = useAuthStore()
const postsStore = usePostsStore()
const { readDraft } = useDraft()
const router = useRouter()
const { isLoggedIn, userEmail, session } = storeToRefs(authStore)
const { ensurePosts } = postsStore

function handleLogout() {
  authStore.logout()
  void router.replace('/about')
}

const profile = ref<UserProfile>({
  id: 'local-user',
  username: 'sign',
  email: 'sign@profile.local',
  displayName: 'Sign',
  bio: '专注前端工程、界面设计与写作流程，把复杂工作拆成可执行的步骤。',
  joinedAt: '2024/05/12',
  lastActive: '今天',
  avatarInitial: 'S',
  visibility: 'public',
})

const isLoadingProfile = ref(true)
const isEditingBio = ref(false)
const isSaving = ref(false)
const editedBio = ref('')
const currentDraft = ref<DraftPayload | null>(null)

const activityFeed = computed(() => {
  const userId = session.value?.user?.id
  if (!userId) return []

  return postsStore.sortedPosts
    .filter((post) => post.author.id === userId)
    .slice(0, 5)
    .map((post) => ({
      type: post.status === 'draft' ? '更新草稿' : '发布文章',
      title: post.title,
      detail: post.excerpt || '暂无摘要',
      time: formatPostDate(post.publishedAt),
    }))
})

const creatorShortcuts = [
  { label: '开始创作', to: '/write', accent: true },
  { label: '管理文章', to: '/about/articles', accent: false },
]

const draftCount = computed(() => (currentDraft.value ? 1 : 0))

const currentDraftPreview = computed(() => {
  if (!currentDraft.value?.markdown) return '当前草稿还没有正文内容。'

  const preview = toPlainText(currentDraft.value.markdown)
  if (!preview) return '当前草稿还没有正文内容。'
  return preview.length > 110 ? `${preview.slice(0, 110).trim()}...` : preview
})

const currentDraftProgress = computed(() => {
  if (!currentDraft.value) return 0

  const titleScore = currentDraft.value.title.trim() ? 25 : 0
  const bodyScore = Math.min(65, Math.round(toPlainText(currentDraft.value.markdown).length / 10))
  const settingsScore =
    currentDraft.value.status === 'draft' || currentDraft.value.visibility === 'private' ? 10 : 0

  return Math.min(100, titleScore + bodyScore + settingsScore)
})

const currentDraftUpdatedLabel = computed(() =>
  currentDraft.value ? formatPostDate(currentDraft.value.updatedAt) : ''
)

const currentDraftStatusLabel = computed(() => {
  if (!currentDraft.value) return ''

  const parts: string[] = []
  if (currentDraft.value.status === 'draft') parts.push('草稿状态')
  if (currentDraft.value.visibility === 'private') parts.push('仅自己可见')

  return parts.length ? `${parts.join(' · ')}，继续完善中` : '已保存，可继续补充内容'
})

const relationshipMetrics = [
  { label: '关注', value: 1 },
  { label: '粉丝', value: 0 },
]

const accountFacts = computed(() => [
  { label: '账号邮箱', value: profile.value.email || userEmail.value || '未绑定' },
  { label: '用户名', value: profile.value.username || '未设置' },
  { label: '可见性', value: profile.value.visibility === 'private' ? '仅自己可见' : '公开' },
  { label: '加入时间', value: profile.value.joinedAt },
  { label: '最近活跃', value: profile.value.lastActive },
])

onMounted(async () => {
  currentDraft.value = readDraft()
  const [profileResult, postsResult] = await Promise.allSettled([profileService.getProfile(), ensurePosts()])

  if (profileResult.status === 'fulfilled') {
    profile.value = profileResult.value
    editedBio.value = profileResult.value.bio
  } else {
    console.error('Failed to load profile', profileResult.reason)
  }

  if (postsResult.status === 'rejected') {
    console.warn('Failed to preload posts for profile view', postsResult.reason)
  }

  isLoadingProfile.value = false
})

async function saveBio() {
  if (!editedBio.value.trim() || isSaving.value) return

  isSaving.value = true

  try {
    const updated = await profileService.updateBio(editedBio.value)
    profile.value = updated
    isEditingBio.value = false
  } catch (err) {
    console.error('Failed to save bio', err)
  } finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  editedBio.value = profile.value.bio
  isEditingBio.value = false
}

function enterEditMode() {
  editedBio.value = profile.value.bio
  isEditingBio.value = true
}
</script>

<template>
  <section class="profile-page">
    <div class="profile-page__inner">
      <header class="profile-hero panel">
        <div class="profile-hero__banner">
          <span class="profile-hero__location">
            {{ profile.visibility === 'private' ? '仅自己可见' : '公开资料' }}
          </span>
        </div>

        <div class="profile-hero__body">
          <div class="profile-hero__identity">
            <div class="profile-avatar" aria-hidden="true">{{ profile.avatarInitial }}</div>

            <div class="profile-hero__meta">
              <h1>{{ profile.displayName }}</h1>
              <p class="profile-hero__account">@{{ profile.username }}</p>
              <div class="profile-hero__facts">
                <span>加入于 {{ profile.joinedAt }}</span>
                <span class="profile-hero__dot">•</span>
                <span>最近活跃 {{ profile.lastActive }}</span>
              </div>

              <div class="profile-hero__relationship" aria-label="关注摘要">
                <span
                  v-for="item in relationshipMetrics"
                  :key="item.label"
                  class="profile-hero__relationship-item"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </span>
              </div>

              <p class="profile-hero__caption">创作者档案</p>
            </div>
          </div>

          <div class="profile-hero__actions">
            <RouterLink to="/write" class="hero-btn hero-btn--primary">开始创作</RouterLink>
            <button v-if="isLoggedIn" type="button" class="hero-btn hero-btn--secondary" @click="handleLogout">
              退出登录
            </button>
          </div>
        </div>

      </header>

      <div class="profile-layout">
        <section class="profile-main">
          <article class="panel section-card">
            <header class="section-card__head">
              <div>
                <p class="section-card__eyebrow">动态</p>
                <h2>我的动态</h2>
              </div>
              <span class="section-card__hint">最近更新</span>
            </header>

            <div class="activity-list">
              <article v-for="item in activityFeed" :key="`${item.type}-${item.title}`" class="activity-item">
                <div class="activity-item__head">
                  <span class="activity-item__badge">{{ item.type }}</span>
                  <time class="activity-item__time">{{ item.time }}</time>
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.detail }}</p>
              </article>
              <div v-if="activityFeed.length === 0" class="draft-empty">
                <p>还没有发布过文章，去写一篇吧。</p>
              </div>
            </div>
          </article>

          <article class="panel section-card">
            <header class="section-card__head">
              <div>
                <p class="section-card__eyebrow">创作</p>
                <h2>草稿进度</h2>
              </div>
              <RouterLink to="/write" class="section-card__link">继续编辑</RouterLink>
            </header>

            <div class="draft-list">
              <article v-if="currentDraft" class="draft-item">
                <div class="draft-item__head">
                  <div>
                    <h3>{{ currentDraft.title || '未命名草稿' }}</h3>
                    <p>{{ currentDraftStatusLabel }}</p>
                  </div>
                  <span class="draft-item__time">{{ currentDraftUpdatedLabel }}</span>
                </div>

                <p>{{ currentDraftPreview }}</p>

                <div class="draft-item__progress">
                  <span :style="{ width: `${currentDraftProgress}%` }"></span>
                </div>

                <div class="draft-item__footer">
                  <span>完成度 {{ currentDraftProgress }}%</span>
                </div>
              </article>

              <div v-else class="draft-empty">
                <p>当前没有可继续编辑的草稿。</p>
              </div>
            </div>
          </article>
        </section>

        <aside class="profile-side">
          <article class="panel side-card side-card--creator">
            <header class="side-card__head">
              <div>
                <p class="section-card__eyebrow">创作中心</p>
                <h3>保持输出节奏</h3>
              </div>
              <span class="side-card__tag">草稿 {{ draftCount }}</span>
            </header>

            <p class="side-card__text">把灵感、草稿和已发布内容收口在一个工作台里，继续完成下一篇文章。</p>

            <div class="side-card__actions">
              <RouterLink
                v-for="action in creatorShortcuts"
                :key="action.label"
                :to="action.to"
                class="side-action"
                :class="{ 'side-action--primary': action.accent }"
              >
                {{ action.label }}
              </RouterLink>
            </div>
          </article>

          <article class="panel side-card">
            <header class="side-card__head side-card__head--tight">
              <div>
                <p class="section-card__eyebrow">资料</p>
                <h3>个人简介</h3>
              </div>
              <button v-if="isLoggedIn && !isEditingBio" type="button" class="edit-btn" @click="enterEditMode">
                编辑个人资料
              </button>
            </header>

            <div v-if="isEditingBio" class="bio-edit-mode">
              <textarea v-model="editedBio" class="bio-textarea" rows="4" :disabled="isSaving"></textarea>
              <div class="bio-edit-actions">
                <button class="bio-btn bio-btn--save" :disabled="isSaving" @click="saveBio">
                  {{ isSaving ? '保存中...' : '保存' }}
                </button>
                <button class="bio-btn bio-btn--cancel" :disabled="isSaving" @click="cancelEdit">取消</button>
              </div>
            </div>

            <div v-else class="bio-block">
              <template v-if="isLoadingProfile">
                <div class="bio-skeleton"></div>
                <div class="bio-skeleton bio-skeleton--short"></div>
              </template>
              <p v-else>{{ profile.bio }}</p>
            </div>

            <dl class="fact-list">
              <div v-for="fact in accountFacts" :key="fact.label" class="fact-list__row">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
          </article>

        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.profile-page {
  width: 100%;
  padding: 64px 20px 48px;
  color: var(--ink-strong);
}

.profile-page__inner {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.panel {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, var(--card-top), var(--card-bottom));
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(12px);
}

.profile-hero {
  overflow: hidden;
}

.profile-hero__banner {
  min-height: 164px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  background:
    radial-gradient(circle at 16% 22%, rgba(47, 143, 255, 0.22), transparent 30%),
    radial-gradient(circle at 84% 18%, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(135deg, rgba(47, 143, 255, 0.18), rgba(0, 113, 227, 0.04)),
    linear-gradient(180deg, var(--surface-overlay), var(--surface-frost));
  position: relative;
  border-bottom: 1px solid var(--line-soft);
}

.profile-hero__banner::before,
.profile-hero__banner::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.profile-hero__banner::before {
  width: 240px;
  height: 240px;
  right: -72px;
  bottom: -120px;
}

.profile-hero__banner::after {
  width: 160px;
  height: 160px;
  left: 18%;
  top: -70px;
}

.profile-hero__location {
  position: relative;
  z-index: 1;
  padding: 0.48rem 0.82rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-main);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.profile-hero__body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.2rem;
  padding: 0 1.75rem 1.25rem;
  margin-top: -64px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.profile-hero__identity {
  display: flex;
  align-items: flex-end;
  gap: 1.35rem;
  min-width: 280px;
}

.profile-avatar {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-lg);
  border: 6px solid var(--surface-strong);
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.3), transparent 28%),
    linear-gradient(145deg, var(--brand-400) 0%, var(--brand-500) 100%);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 3rem;
  font-weight: 800;
  box-shadow: 0 18px 36px rgba(0, 113, 227, 0.22);
}

.profile-hero__meta {
  padding-bottom: 0.25rem;
}

.profile-hero__meta h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.7rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.profile-hero__account {
  margin: 0.55rem 0 0;
  color: var(--ink-muted);
  font-size: 1rem;
}

.profile-hero__facts {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  color: var(--ink-muted);
  font-size: 0.92rem;
}

.profile-hero__caption {
  margin: 0.7rem 0 0;
  color: var(--ink-muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.profile-hero__relationship {
  margin-top: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.profile-hero__relationship-item {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-muted);
  font-size: 0.8rem;
  line-height: 1;
}

.profile-hero__relationship-item strong {
  color: var(--ink-strong);
  font-size: 0.94rem;
  font-weight: 800;
}

.profile-hero__dot {
  opacity: 0.45;
}

.profile-hero__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-btn {
  padding: 0.78rem 1.3rem;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
}

.hero-btn:hover {
  transform: translateY(-1px);
}

.hero-btn--primary {
  background: var(--brand-500);
  color: #fff;
  border-color: var(--brand-500);
}

.hero-btn--secondary {
  background: var(--surface-strong);
  color: var(--ink-main);
}

.hero-btn--secondary:hover {
  border-color: rgba(0, 113, 227, 0.26);
  background: var(--surface-hover);
}

.profile-layout {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.9fr);
  gap: 1rem;
  align-items: flex-start;
}

.profile-main,
.profile-side {
  display: grid;
  gap: 1rem;
}

.section-card,
.side-card {
  padding: 1.3rem;
}

.section-card__head,
.side-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.side-card__head--tight {
  margin-bottom: 0.9rem;
}

.section-card__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.section-card__head h2,
.side-card__head h3 {
  margin: 0.22rem 0 0;
  color: var(--ink-strong);
}

.section-card__hint,
.side-card__tag,
.section-card__link {
  color: var(--ink-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.section-card__link {
  color: var(--brand-500);
  text-decoration: none;
}

.activity-list,
.draft-list {
  display: grid;
  gap: 0.85rem;
}

.activity-item,
.draft-item {
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
}

.draft-empty {
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px dashed var(--line-soft);
  background: var(--bg-canvas-soft);
  color: var(--ink-muted);
}

.draft-empty p {
  margin: 0;
}

.activity-item__head,
.draft-item__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.activity-item__badge {
  padding: 0.26rem 0.62rem;
  border-radius: 999px;
  background: var(--brand-100);
  color: var(--brand-500);
  font-size: 0.78rem;
  font-weight: 700;
}

.activity-item__time,
.draft-item__time {
  color: var(--ink-muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.activity-item h3,
.draft-item h3 {
  margin: 0.72rem 0 0.35rem;
  color: var(--ink-strong);
  font-size: 1.12rem;
}

.activity-item p,
.draft-item p {
  margin: 0;
  color: var(--ink-muted);
  line-height: 1.65;
}

.draft-item__progress {
  margin-top: 0.9rem;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: var(--line-soft);
  overflow: hidden;
}

.draft-item__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand-400), var(--brand-500));
}

.draft-item__footer {
  margin-top: 0.58rem;
  color: var(--brand-500);
  font-size: 0.84rem;
  font-weight: 700;
}

.side-card--creator {
  background:
    radial-gradient(circle at top left, rgba(0, 113, 227, 0.14), transparent 52%),
    linear-gradient(180deg, var(--card-top), var(--card-bottom));
}

.side-card__text {
  margin: 0;
  color: var(--ink-muted);
  line-height: 1.68;
}

.side-card__actions {
  margin-top: 1rem;
  display: grid;
  gap: 0.72rem;
}

.side-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 999px;
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-strong);
  text-decoration: none;
  font-weight: 700;
}

.side-action--primary {
  background: var(--brand-500);
  color: #fff;
  border-color: var(--brand-500);
}

.edit-btn {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--brand-500);
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.bio-block p {
  margin: 0;
  color: var(--ink-muted);
  line-height: 1.7;
}

.bio-edit-mode {
  display: grid;
  gap: 0.8rem;
}

.bio-textarea {
  width: 100%;
  min-height: 110px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  color: var(--ink-strong);
  padding: 0.85rem 0.95rem;
  line-height: 1.7;
  resize: vertical;
}

.bio-textarea:focus {
  outline: none;
  border-color: rgba(0, 113, 227, 0.35);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.bio-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}

.bio-btn {
  border-radius: 10px;
  padding: 0.6rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.bio-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bio-btn--save {
  border: none;
  background: var(--brand-500);
  color: #fff;
}

.bio-btn--cancel {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--ink-main);
}

.bio-skeleton {
  height: 14px;
  border-radius: 999px;
  background: var(--line-soft);
  animation: pulse 1.5s ease-in-out infinite;
}

.bio-skeleton--short {
  width: 62%;
  margin-top: 0.5rem;
}

.fact-list {
  margin: 1rem 0 0;
  display: grid;
  gap: 0.7rem;
}

.fact-list__row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  padding-top: 0.7rem;
  border-top: 1px dashed var(--line-soft);
}

.fact-list__row dt,
.fact-list__row dd {
  margin: 0;
}

.fact-list__row dt {
  color: var(--ink-muted);
}

.fact-list__row dd {
  color: var(--ink-strong);
  text-align: right;
  font-weight: 600;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

@media (max-width: 1024px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .profile-hero__body {
    align-items: flex-start;
  }

  .profile-hero__identity {
    align-items: center;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: 40px 14px 40px;
  }

  .profile-hero__banner {
    min-height: 108px;
    padding: 0.8rem 0.9rem;
  }

  .profile-hero__banner::before {
    width: 180px;
    height: 180px;
    right: -66px;
    bottom: -106px;
  }

  .profile-hero__banner::after {
    width: 112px;
    height: 112px;
    left: 20%;
    top: -42px;
  }

  .profile-hero__location {
    padding: 0.36rem 0.68rem;
    font-size: 0.74rem;
  }

  .profile-hero__body {
    margin-top: -34px;
    padding: 0 0.9rem 0.9rem;
    gap: 0.8rem;
  }

  .profile-hero__identity {
    flex-direction: row;
    align-items: flex-end;
    gap: 0.8rem;
    min-width: 0;
  }

  .profile-avatar {
    width: 88px;
    height: 88px;
    border-width: 4px;
    font-size: 1.85rem;
  }

  .profile-hero__meta {
    padding-bottom: 0;
  }

  .profile-hero__meta h1 {
    font-size: clamp(1.68rem, 8vw, 2rem);
  }

  .profile-hero__account {
    margin-top: 0.35rem;
    font-size: 0.92rem;
  }

  .profile-hero__facts {
    margin-top: 0.35rem;
    gap: 0.28rem;
    font-size: 0.82rem;
  }

  .profile-hero__relationship {
    margin-top: 0.5rem;
    gap: 0.4rem;
  }

  .profile-hero__relationship-item {
    padding: 0.36rem 0.6rem;
    font-size: 0.76rem;
  }

  .profile-hero__relationship-item strong {
    font-size: 0.88rem;
  }

  .profile-hero__caption {
    display: none;
  }

  .profile-hero__actions {
    width: 100%;
    gap: 0.55rem;
  }

  .hero-btn {
    flex: 1;
    min-height: 44px;
    padding: 0.68rem 1rem;
    font-size: 0.92rem;
    text-align: center;
  }
}
</style>
