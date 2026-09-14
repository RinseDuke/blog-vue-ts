<template>
  <TopicList :topics="topics" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types/post'
import TopicList from '@/components/topic/TopicList.vue'
import { mapPostToTopic } from '@/features/topic/topic'

const props = defineProps<{
  posts: Post[]
}>()

const topics = computed(() => props.posts.map(mapPostToTopic))
</script>
