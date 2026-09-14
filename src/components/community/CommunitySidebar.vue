<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const { isLoggedIn } = storeToRefs(useAuthStore())
const route = useRoute()

function isCurrent(to: { name: string; query?: { sort: string } }) {
  if (route.name !== to.name) return false
  if (to.name !== 'article-list') return true
  if (route.query.tag || route.query.q || route.query.keyword) return false
  return (route.query.sort || 'newest') === to.query?.sort
}

const primaryItems = computed(() => [
  { label: '首页', description: '社区动态', to: { name: 'home' }, icon: '⌂' },
  { label: '最新', description: '最近发布', to: { name: 'article-list', query: { sort: 'newest' } }, icon: '◷' },
  { label: '热门', description: '按点赞数排序', to: { name: 'article-list', query: { sort: 'popular' } }, icon: '↗' },
])

const accountItems = computed(() => [
  {
    label: isLoggedIn.value ? '我的内容' : '登录社区',
    description: isLoggedIn.value ? '文章与草稿' : '参与写作讨论',
    to: { name: isLoggedIn.value ? 'profile-articles' : 'about' },
    icon: '◎',
  },
])
</script>

<template>
  <nav class="community-sidebar" aria-label="社区导航">
    <div class="community-sidebar__group">
      <p class="community-sidebar__label">浏览</p>
      <RouterLink v-for="item in primaryItems" :key="item.label" :to="item.to" custom v-slot="{ href, navigate }">
        <a :href="href" @click="navigate" class="community-sidebar__item" :class="{ 'is-current': isCurrent(item.to) }" :aria-current="isCurrent(item.to) ? 'page' : undefined">
        <span class="community-sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </span>
        </a>
      </RouterLink>
    </div>

    <div class="community-sidebar__group community-sidebar__group--account">
      <p class="community-sidebar__label">账户</p>
      <RouterLink v-for="item in accountItems" :key="item.label" :to="item.to" class="community-sidebar__item">
        <span class="community-sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.description }}</small>
        </span>
      </RouterLink>
    </div>

    <RouterLink :to="{ name: 'write' }" class="community-sidebar__compose">发起主题</RouterLink>
  </nav>
</template>

<style scoped lang="less">
.community-sidebar {
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.75rem 0;
}

.community-sidebar__group {
  display: grid;
  gap: 0.25rem;
}

.community-sidebar__group--account {
  padding-top: 1rem;
  border-top: 1px solid var(--line-soft);
}

.community-sidebar__label {
  margin: 0 0 0.35rem;
  padding: 0 0.7rem;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 650;
}

.community-sidebar__item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.45rem 0.65rem;
  border-radius: var(--radius-md);
  color: var(--ink-main);
  text-decoration: none;
  transition: background-color var(--motion-fast) ease, color var(--motion-fast) ease;
}

.community-sidebar__item:hover,
.community-sidebar__item.is-current,
.community-sidebar__group--account .router-link-exact-active {
  background: var(--surface-hover);
  color: var(--ink-strong);
}

.community-sidebar__icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: var(--surface-strong);
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.community-sidebar__item strong,
.community-sidebar__item small {
  display: block;
}

.community-sidebar__item strong {
  color: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.25;
}

.community-sidebar__item small {
  margin-top: 0.15rem;
  color: var(--ink-muted);
  font-size: 0.72rem;
  line-height: 1.2;
}

.community-sidebar__compose {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  border-radius: var(--radius-md);
  background: var(--brand-500);
  color: var(--on-accent);
  font-size: 0.88rem;
  font-weight: 650;
  text-decoration: none;
}
</style>
