import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path:'/write',
      name:'write',
      
      component:()=>import('../views/Write.vue')
    },
    {
      path: '/article',
      name: 'article-list',
      component: () => import('../views/ArticlePage.vue'),
    },
    {
      path: '/article/:slug',
      name: 'article-detail',
      
      component: () => import('../views/ArticlePage.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component:()=>import('../views/Search.vue'),
    },
  ],
})

export default router
