<!-- 个人主页入口：已登录显示 AboutView，未登录显示 LoginView -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import AboutView from './AboutView.vue'

const LoginView = defineAsyncComponent(() => import('./LoginView.vue'))

const { isLoggedIn } = storeToRefs(useAuthStore())
</script>

<template>
  <AboutView v-if="isLoggedIn" />
  <LoginView v-else />
</template>
