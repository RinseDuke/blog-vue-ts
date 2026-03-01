import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

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
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/write',
      name: 'write',
      component: () => import('../views/Write.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/article',
      name: 'article-list',
      component: () => import('../views/ArticleListView.vue'),
    },
    {
      path: '/article/:slug',
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
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
