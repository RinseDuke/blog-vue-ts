<template>
  <div class="post-list">
    <PostCard v-for="post in posts" :key="post.id" :post="post" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '@/types/post'
import PostCard from '@/components/post/PostCard.vue'

defineProps<{
  posts: Post[]
}>()
</script>
