<script setup lang="ts">
import { RouterLink } from 'vue-router'

const profile = {
  displayName: 'Sign',
  title: 'Frontend Engineer - Product Experience Enthusiast',
  bio: 'I focus on frontend engineering, interface design, and writing workflows to turn complex work into clear execution steps.',
  location: 'Hangzhou',
  joinedAt: '2024-05-12',
  lastActive: 'Today',
  avatarInitial: 'S',
}

const stats = [
  { label: 'Published', value: '36', helper: 'Last 30 days +4' },
  { label: 'Total Reads', value: '128k', helper: 'Avg 3.5k / post' },
  { label: 'Followers', value: '1,208', helper: 'This week +22' },
  { label: 'Bookmarks', value: '412', helper: 'Saved 3.9k times' },
]

const quickActions = [
  { label: 'Write New Post', to: '/write' },
  { label: 'Manage Posts', to: '/article' },
  { label: 'Search Posts', to: '/search' },
]

const highlights = [
  { label: 'Writing Rhythm', value: '12-Day Consistency', detail: '3 drafts completed this week with stable output.' },
  { label: 'Content Focus', value: 'Engineering - UX Design', detail: 'Most readers follow architecture and performance topics.' },
  { label: 'Next Goal', value: '8 Posts Next Month', detail: 'Target: one deep article every 4 days.' },
]

const drafts = [
  { title: 'Build a Maintainable Blog from Scratch', updatedAt: '2 hours ago', progress: '70%' },
  { title: 'Vue 3 Complex Form Best Practices', updatedAt: 'Yesterday', progress: '45%' },
  { title: 'Color Semantics in Design Systems', updatedAt: '3 days ago', progress: '20%' },
]

const recentActivity = [
  { label: 'Published "Frontend Structure Review"', time: 'Today 09:30' },
  { label: 'Updated "Vue Router Advanced Patterns"', time: 'Yesterday 20:10' },
  { label: 'Replied to 12 comments', time: 'Yesterday 16:40' },
  { label: 'Gained 22 new followers', time: '2 days ago' },
]
</script>

<template>
  <section class="profile-page">
    <div class="profile-page__shape" aria-hidden="true"></div>
    <div class="profile-page__inner">
      <header class="hero panel panel--hero">
        <div class="hero__left">
          <div class="avatar" aria-hidden="true">{{ profile.avatarInitial }}</div>
          <div class="hero__meta">
            <p class="hero__eyebrow">Profile Center</p>
            <h1>{{ profile.displayName }}</h1>
            <p class="hero__title">{{ profile.title }}</p>
            <p class="hero__bio">{{ profile.bio }}</p>
            <div class="hero__line">
              <span>{{ profile.location }}</span>
              <span class="hero__dot">|</span>
              <span>Joined {{ profile.joinedAt }}</span>
              <span class="hero__dot">|</span>
              <span>Active {{ profile.lastActive }}</span>
            </div>
          </div>
        </div>

        <div class="hero__actions">
          <RouterLink v-for="action in quickActions" :key="action.label" class="action-btn" :to="action.to">
            {{ action.label }}
          </RouterLink>
        </div>
      </header>

      <section class="stats">
        <article v-for="item in stats" :key="item.label" class="panel stat-card">
          <p class="stat-card__label">{{ item.label }}</p>
          <p class="stat-card__value">{{ item.value }}</p>
          <p class="stat-card__helper">{{ item.helper }}</p>
        </article>
      </section>

      <section class="highlights">
        <article v-for="item in highlights" :key="item.label" class="panel highlight-card">
          <p class="highlight-card__label">{{ item.label }}</p>
          <h3>{{ item.value }}</h3>
          <p class="highlight-card__detail">{{ item.detail }}</p>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel content-panel">
          <header class="content-panel__head">
            <h3>Draft Progress</h3>
            <span class="pill">3 In Progress</span>
          </header>
          <div class="content-panel__list">
            <div v-for="draft in drafts" :key="draft.title" class="list-row">
              <div>
                <p class="list-row__title">{{ draft.title }}</p>
                <p class="list-row__meta">Updated {{ draft.updatedAt }}</p>
              </div>
              <span class="list-row__value">{{ draft.progress }}</span>
            </div>
          </div>
        </article>

        <article class="panel content-panel">
          <header class="content-panel__head">
            <h3>Recent Activity</h3>
            <span class="pill pill--accent">High This Week</span>
          </header>
          <div class="content-panel__list">
            <div v-for="item in recentActivity" :key="item.label" class="list-row">
              <p class="list-row__title">{{ item.label }}</p>
              <span class="list-row__meta">{{ item.time }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap');

.profile-page {
  --ink: #1d1d1f;
  --muted: #6e6e73;
  --line: rgba(0, 0, 0, 0.08);
  --card: rgba(255, 255, 255, 0.82);
  --accent: #0071e3;
  --accent-soft: rgba(0, 113, 227, 0.12);
  position: relative;
  overflow: hidden;
  min-height: 100%;
  padding: 44px 24px 96px;
  color: var(--ink);
  background: linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%);
  font-family: 'Manrope', sans-serif;
}

.profile-page__shape {
  display: none;
}

.profile-page__inner {
  width: min(1040px, 100%);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--card);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.panel--hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.6rem;
  flex-wrap: wrap;
  padding: 1.6rem 1.8rem;
  animation: rise-in 0.55s ease both;
}

.hero__left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 260px;
  flex: 1;
}

.avatar {
  width: 78px;
  height: 78px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(145deg, #2f8fff 0%, #0071e3 100%);
  box-shadow: 0 10px 20px rgba(0, 113, 227, 0.28);
}

.hero__meta h1 {
  margin: 0.1rem 0;
  font-size: clamp(2rem, 4vw, 2.7rem);
  line-height: 1.1;
}

.hero__eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero__title {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.hero__bio {
  margin: 0.55rem 0 0.75rem;
  line-height: 1.68;
  max-width: 560px;
}

.hero__line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.hero__dot {
  opacity: 0.45;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.action-btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.62rem 1.25rem;
  text-decoration: none;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.88);
  font-weight: 600;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 122, 99, 0.45);
  background: #fff;
}

.stats {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.stat-card {
  padding: 1rem 1.1rem;
  animation: rise-in 0.55s ease both;
}

.stat-card:nth-child(1) {
  animation-delay: 0.08s;
}

.stat-card:nth-child(2) {
  animation-delay: 0.12s;
}

.stat-card:nth-child(3) {
  animation-delay: 0.16s;
}

.stat-card:nth-child(4) {
  animation-delay: 0.2s;
}

.stat-card__label {
  margin: 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.stat-card__value {
  margin: 0.4rem 0 0.2rem;
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 800;
}

.stat-card__helper {
  margin: 0;
  color: var(--accent);
  font-size: 0.83rem;
  font-weight: 600;
}

.highlights {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.highlight-card {
  padding: 1.15rem 1.15rem 1.1rem;
  animation: rise-in 0.55s ease both;
}

.highlight-card:nth-child(1) {
  animation-delay: 0.24s;
}

.highlight-card:nth-child(2) {
  animation-delay: 0.28s;
}

.highlight-card:nth-child(3) {
  animation-delay: 0.32s;
}

.highlight-card__label {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.highlight-card h3 {
  margin: 0.45rem 0 0.35rem;
  font-size: 1.3rem;
}

.highlight-card__detail {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.content-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.content-panel {
  padding: 1.2rem;
  animation: rise-in 0.55s ease both;
}

.content-panel:nth-child(1) {
  animation-delay: 0.36s;
}

.content-panel:nth-child(2) {
  animation-delay: 0.4s;
}

.content-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.content-panel__head h3 {
  margin: 0;
  font-size: 1.08rem;
}

.pill {
  padding: 0.24rem 0.66rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
}

.pill--accent {
  color: #694e10;
  background: rgba(226, 183, 98, 0.26);
}

.content-panel__list {
  display: grid;
  gap: 0.62rem;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.72rem 0.82rem;
  border-radius: 12px;
  border: 1px solid rgba(23, 33, 45, 0.08);
  background: #f9fbfa;
}

.list-row__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
}

.list-row__meta {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.84rem;
}

.list-row__value {
  font-size: 0.9rem;
  color: var(--accent);
  font-weight: 700;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 980px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .highlights {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .profile-page {
    padding: 30px 16px 72px;
  }

  .panel--hero {
    padding: 1.2rem;
  }

  .hero__actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 520px) {
  .stats {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel--hero,
  .stat-card,
  .highlight-card,
  .content-panel {
    animation: none;
  }

  .action-btn {
    transition: none;
  }
}
</style>
