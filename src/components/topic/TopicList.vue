<script setup lang="ts">
import type { TopicListItem } from '@/features/topic/topic'
import TopicRow from './TopicRow.vue'

defineProps<{
  topics: TopicListItem[]
}>()
</script>

<template>
  <section class="topic-list" aria-label="主题列表">
    <TopicRow v-for="topic in topics" :key="topic.id" :topic="topic" />
  </section>
</template>

<style scoped>
.topic-list {
  background: var(--surface-strong);
}
</style>
