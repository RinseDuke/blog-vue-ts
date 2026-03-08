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
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if ((to.name === 'login' || to.name === 'register') && auth.isLoggedIn) {
    next(resolveAuthRedirect(to.query.redirect))
    return
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'about', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
