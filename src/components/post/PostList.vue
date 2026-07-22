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

<style scoped>
.post-list {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(0.9rem, 2vw, 1.35rem);
  min-width: 0;
}

.post-list > :deep(*) {
  grid-column: span 6;
  min-width: 0;
}

.post-list > :nth-child(3n + 1) {
  grid-column: span 7;
}

.post-list > :nth-child(3n + 2) {
  grid-column: span 5;
}

.post-list > :nth-child(3n) {
  grid-column: 1 / -1;
}

@media (max-width: 1024px) {
  .post-list > :nth-child(3n + 1),
  .post-list > :nth-child(3n + 2),
  .post-list > :nth-child(3n) {
    grid-column: span 6;
  }
}

@media (max-width: 768px) {
  .post-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .post-list > :nth-child(3n + 1),
  .post-list > :nth-child(3n + 2),
  .post-list > :nth-child(3n) {
    grid-column: 1 / -1;
  }
}
</style>
