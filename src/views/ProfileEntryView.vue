<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import AboutView from './AboutView.vue'
import LoginView from './LoginView.vue'

const { isLoggedIn } = storeToRefs(useAuthStore())
</script>

<template>
  <AboutView v-if="isLoggedIn" />
  <LoginView v-else />
</template>
