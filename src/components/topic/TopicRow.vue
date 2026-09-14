<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { TopicListItem } from '@/features/topic/topic'
import { formatPostDate } from '@/features/post/utils/post'

const props = defineProps<{
  topic: TopicListItem
}>()

const authorInitial = computed(() => props.topic.author.name.trim().slice(0, 1) || '墨')
const hasMetrics = computed(() => props.topic.replyCount !== undefined || props.topic.viewCount !== undefined)
</script>

<template>
  <article class="topic-row" :class="{ 'topic-row--official': topic.official }">
    <RouterLink :to="{ name: 'article-detail', params: { id: topic.id } }" class="topic-row__link">
      <div class="topic-row__avatar" aria-hidden="true">
        <img v-if="topic.author.avatarUrl" :src="topic.author.avatarUrl" alt="" />
        <span v-else>{{ authorInitial }}</span>
      </div>

      <div class="topic-row__content">
        <div class="topic-row__meta">
          <span v-if="topic.official" class="topic-row__official">官方</span>
          <span v-for="tag in topic.tags.slice(0, 2)" :key="tag" class="topic-row__tag">{{ tag }}</span>
        </div>
        <h2>{{ topic.title }}</h2>
        <p v-if="topic.excerpt" class="topic-row__excerpt">{{ topic.excerpt }}</p>
        <div class="topic-row__byline">
          <strong>{{ topic.author.name }}</strong>
          <span>{{ formatPostDate(topic.lastActivityAt) }}</span>
          <span>{{ topic.readMinutes }} 分钟阅读</span>
        </div>
      </div>
    </RouterLink>

    <dl v-if="hasMetrics" class="topic-row__metrics" aria-label="主题统计">
      <div v-if="topic.replyCount !== undefined">
        <dt>回复</dt>
        <dd>{{ topic.replyCount }}</dd>
      </div>
      <div v-if="topic.viewCount !== undefined">
        <dt>浏览</dt>
        <dd>{{ topic.viewCount }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped lang="less">
.topic-row {
  position: relative;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-strong);
  transition: background-color var(--motion-fast) ease;
}

.topic-row:last-child {
  border-bottom: 0;
}

.topic-row:hover {
  background: color-mix(in srgb, var(--surface-hover) 64%, var(--surface-strong));
}

.topic-row--official {
  box-shadow: inset 3px 0 0 var(--brand-500);
}

.topic-row__link {
  min-width: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 0.85rem;
  padding: 1.1rem 1.25rem;
  color: inherit;
  text-decoration: none;
}

.topic-row__avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 13px;
  background: var(--bg-canvas);
  color: var(--ink-main);
  font-size: 0.92rem;
  font-weight: 700;
}

.topic-row__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topic-row__content {
  min-width: 0;
}

.topic-row__meta {
  min-height: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.topic-row__official,
.topic-row__tag {
  padding: 0.18rem 0.42rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.2;
}

.topic-row__official {
  background: var(--brand-100);
  color: var(--brand-500);
}

.topic-row__tag {
  background: var(--bg-canvas);
  color: var(--ink-muted);
}

.topic-row h2 {
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 680;
  line-height: 1.4;
}

.topic-row:hover h2 {
  color: var(--brand-500);
}

.topic-row__excerpt {
  margin: 0.35rem 0 0;
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.82rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.topic-row__byline {
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--ink-muted);
  font-size: 0.72rem;
}

.topic-row__byline strong {
  color: var(--ink-main);
  font-weight: 620;
}

.topic-row__byline span + span::before {
  content: '·';
  margin-right: 0.5rem;
}

.topic-row__metrics {
  min-width: 112px;
  margin: 0;
  padding: 1.1rem 1.15rem 1.1rem 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.topic-row__metrics div {
  text-align: right;
}

.topic-row__metrics dt {
  color: var(--ink-muted);
  font-size: 0.64rem;
}

.topic-row__metrics dd {
  margin: 0.15rem 0 0;
  color: var(--ink-main);
  font-size: 0.82rem;
  font-weight: 650;
}

@media (max-width: 640px) {
  .topic-row__link {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 0.65rem;
    padding: 0.95rem 0.85rem;
  }

  .topic-row__avatar {
    width: 36px;
    height: 36px;
    border-radius: 11px;
  }

  .topic-row h2 {
    font-size: 0.98rem;
  }

  .topic-row__excerpt,
  .topic-row__metrics,
  .topic-row__byline span:last-child {
    display: none;
  }
}
</style>
