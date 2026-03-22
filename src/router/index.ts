/**
 * 路由配置
 * 定义所有页面路由，并通过 beforeEach 守卫实现认证拦截。
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileEntryView from '../views/ProfileEntryView.vue'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    },
    {
      path: '/about/articles',
      name: 'profile-articles',
      component: () => import('../views/ProfileArticlesView.vue'),
      meta: { requiresAuth: true }, // 需要登录
    },
    {
      path: '/write',
      name: 'write',
      component: () => import('../views/Write.vue'),
      meta: { requiresAuth: true }, // 需要登录
    },
    {
      path: '/article',
      name: 'article-list',
      component: () => import('../views/ArticleListView.vue'),
    },
    {
      path: '/article/:id',
      name: 'article-detail',
      component: () => import('../views/ArticleDetailView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/Search.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
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

export default router
