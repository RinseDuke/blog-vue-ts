/**
 * 路由配置
 * 定义所有页面路由，并通过 beforeEach 守卫实现认证拦截。
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileEntryView from '../views/ProfileEntryView.vue'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'

export const SITE_TITLE = '墨言 · 写作与工程笔记'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: ProfileEntryView,
      meta: { title: '个人主页' },
    },
    {
      path: '/about/articles',
      name: 'profile-articles',
      component: () => import('../views/ProfileArticlesView.vue'),
      meta: { requiresAuth: true, title: '我的主题' }, // 需要登录
    },
    {
      path: '/write',
      name: 'write',
      component: () => import('../views/Write.vue'),
      meta: { requiresAuth: true, title: '写作' }, // 需要登录
    },
    {
      path: '/article',
      name: 'article-list',
      component: () => import('../views/ArticleListView.vue'),
      meta: { title: '全部主题' },
    },
    {
      path: '/article/:id',
      name: 'article-detail',
      component: () => import('../views/ArticleDetailView.vue'),
      meta: { title: '主题' }, // 加载后由详情页替换为主题标题
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/Search.vue'),
      meta: { title: '搜索' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { title: '注册' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'home' },
    },
  ],
})

// ── 全局路由守卫：认证拦截 ──
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // 已登录用户访问登录/注册页 → 重定向走
  if ((to.name === 'login' || to.name === 'register') && auth.isLoggedIn) {
    next(resolveAuthRedirect(to.query.redirect))
    return
  }

  // 未登录用户访问受保护页面 → 跳转到 /about 并携带 redirect 参数
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'about', query: { redirect: to.fullPath } })
    return
  }

  next()
})

// ── 全局路由守卫：页面标题 ──
// 每次导航后按路由 meta 重置标题，避免上一页（如主题详情）的标题残留。
router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = pageTitle ? `${pageTitle} · 墨言` : SITE_TITLE
})

export default router
