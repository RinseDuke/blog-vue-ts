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
