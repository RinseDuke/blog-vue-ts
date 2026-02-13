<script setup lang="ts">
import { RouterLink } from 'vue-router'

const profile = {
  displayName: 'Sign',
  title: '前端作者 · 产品体验爱好者',
  bio: '记录技术、设计与写作方法，把复杂的事情讲清楚。',
  location: '杭州',
  joinedAt: '2024-05-12',
  lastActive: '今天',
  avatarInitial: 'S',
}

const stats = [
  { label: '发布文章', value: '36', helper: '近 30 天 +4' },
  { label: '累计阅读', value: '128k', helper: '平均 3.5k/篇' },
  { label: '关注者', value: '1,208', helper: '本周 +22' },
  { label: '收藏', value: '412', helper: '被收藏 3.9k 次' },
]

const quickActions = [
  { label: '写新文章', to: '/write' },
  { label: '管理文章', to: '/' },
  { label: '查看搜索', to: '/search' },
]

const focusCards = [
  {
    title: '创作节奏',
    value: '12 天连续写作',
    desc: '本周已完成 3 篇草稿，保持稳定输出。',
  },
  {
    title: '内容方向',
    value: '前端工程 · 体验设计',
    desc: '读者最关注：架构实践、性能优化、写作方法。',
  },
  {
    title: '成长目标',
    value: '下月发布 8 篇',
    desc: '平均每 4 天完成一篇，主打深度长文。',
  },
]

const drafts = [
  { title: '从零搭建高可用博客系统', updatedAt: '2 小时前', progress: '70%' },
  { title: 'Vue 3 复杂表单最佳实践', updatedAt: '昨天', progress: '45%' },
  { title: '设计系统的颜色语义', updatedAt: '3 天前', progress: '20%' },
]

const recentActivity = [
  { label: '发布《前端项目结构复盘》', time: '今天 09:30' },
  { label: '更新《Vue Router 高级技巧》', time: '昨天 20:10' },
  { label: '回复评论 12 条', time: '昨天 16:40' },
  { label: '新增粉丝 22 人', time: '2 天前' },
]
</script>

<template>
  <section class="about-page">
    <div class="about-page__inner">
    <header class="hero">
      <div class="hero__profile">
        <div class="avatar" aria-hidden="true">{{ profile.avatarInitial }}</div>
        <div class="hero__meta">
          <p class="eyebrow">个人用户中心</p>
          <h1>{{ profile.displayName }}</h1>
          <p class="title">{{ profile.title }}</p>
          <p class="bio">{{ profile.bio }}</p>
          <div class="meta-line">
            <span>{{ profile.location }}</span>
            <span class="dot">•</span>
            <span>加入于 {{ profile.joinedAt }}</span>
            <span class="dot">•</span>
            <span>活跃：{{ profile.lastActive }}</span>
          </div>
        </div>
      </div>
      <div class="hero__actions">
        <RouterLink
          v-for="item in quickActions"
          :key="item.label"
          class="action-btn"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </header>

    <section class="stats">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <p class="stat-label">{{ item.label }}</p>
        <p class="stat-value">{{ item.value }}</p>
        <p class="stat-helper">{{ item.helper }}</p>
      </article>
    </section>

    <section class="grid">
      <article v-for="card in focusCards" :key="card.title" class="card">
        <h3>{{ card.title }}</h3>
        <p class="card-value">{{ card.value }}</p>
        <p class="card-desc">{{ card.desc }}</p>
      </article>
    </section>

    <section class="split">
      <article class="panel">
        <header class="panel__head">
          <h3>草稿进度</h3>
          <span class="panel__badge">3 篇进行中</span>
        </header>
        <div class="panel__body">
          <div v-for="draft in drafts" :key="draft.title" class="draft-row">
            <div class="draft-info">
              <p class="draft-title">{{ draft.title }}</p>
              <p class="draft-meta">更新于 {{ draft.updatedAt }}</p>
            </div>
            <span class="draft-progress">{{ draft.progress }}</span>
          </div>
        </div>
      </article>

      <article class="panel">
        <header class="panel__head">
          <h3>最近动态</h3>
          <span class="panel__badge panel__badge--accent">本周高峰</span>
        </header>
        <div class="panel__body">
          <div v-for="item in recentActivity" :key="item.label" class="activity-row">
            <p class="activity-label">{{ item.label }}</p>
            <span class="activity-time">{{ item.time }}</span>
          </div>
        </div>
      </article>
    </section>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=ZCOOL+KuaiLe&display=swap');

.about-page {
  --ink: #0f172a;
  --muted: #64748b;
  --accent: #e76f51;
  --accent-2: #2a9d8f;
  --accent-3: #f4a261;
  --card: #ffffff;
  --surface: rgba(255, 255, 255, 0.78);
  background:
    radial-gradient(circle at 12% 8%, #ffe9d6 0%, transparent 40%),
    radial-gradient(circle at 85% 15%, #e0f2f1 0%, transparent 45%),
    linear-gradient(180deg, #faf7f2 0%, #f6f7fb 100%);
  padding: 80px 24px 120px;
  color: var(--ink);
  min-height: 100%;
  font-family: 'Space Grotesk', 'ZCOOL KuaiLe', sans-serif;
}

.about-page__inner {
  width: clamp(320px, 50vw, 980px);
  margin: 0 auto;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.hero__profile {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex: 1;
  min-width: 280px;
}

.avatar {
  width: 86px;
  height: 86px;
  border-radius: 26px;
  background: linear-gradient(140deg, #f4a261, #e76f51);
  color: #fff;
  font-size: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 40px rgba(231, 111, 81, 0.28);
  font-family: 'ZCOOL KuaiLe', 'Space Grotesk', sans-serif;
}

.hero__meta h1 {
  font-size: clamp(2rem, 3.2vw, 2.8rem);
  margin: 0.2rem 0 0.2rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.78rem;
  color: var(--accent-2);
  font-weight: 700;
  margin: 0;
}

.title {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.bio {
  margin: 0.6rem 0 0.75rem;
  max-width: 520px;
  color: #1f2937;
  line-height: 1.7;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.dot {
  opacity: 0.4;
}

.hero__actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  background: var(--card);
  color: var(--ink);
  border: 1px solid rgba(15, 23, 42, 0.12);
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2.4rem;
}

.stat-card {
  background: var(--surface);
  border-radius: 18px;
  padding: 1.1rem 1.4rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.stat-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.stat-value {
  margin: 0.5rem 0 0.3rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ink);
}

.stat-helper {
  margin: 0;
  color: var(--accent-2);
  font-weight: 600;
  font-size: 0.85rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2.4rem;
}

.card {
  background: var(--card);
  border-radius: 20px;
  padding: 1.4rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.card h3 {
  margin: 0;
  font-size: 1.1rem;
}

.card-value {
  margin: 0.7rem 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
}

.card-desc {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.4rem;
}

.panel {
  background: var(--card);
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 1.5rem;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel__head h3 {
  margin: 0;
  font-size: 1.15rem;
}

.panel__badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(42, 157, 143, 0.12);
  color: var(--accent-2);
  font-weight: 600;
  font-size: 0.8rem;
}

.panel__badge--accent {
  background: rgba(244, 162, 97, 0.18);
  color: #b45309;
}

.panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.draft-row,
.activity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  background: #f8fafc;
}

.draft-title {
  margin: 0;
  font-weight: 600;
  color: var(--ink);
}

.draft-meta {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.draft-progress {
  font-weight: 700;
  color: var(--accent-2);
}

.activity-label {
  margin: 0;
  color: var(--ink);
  font-weight: 600;
}

.activity-time {
  font-size: 0.85rem;
  color: var(--muted);
}

@media (max-width: 820px) {
  .hero {
    align-items: flex-start;
  }

  .hero__actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
