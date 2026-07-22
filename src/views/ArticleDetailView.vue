<script setup lang="ts">
import Article from '@/components/Article.vue'
</script>

<template>
  <section class="article-detail-view">
    <Article />
  </section>
</template>

<style scoped>
.article-detail-view {
  width: 100%;
  min-width: 0;
  padding: clamp(1rem, 3vw, 2.5rem) 1rem 3rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--brand-100) 22%, transparent), transparent 22rem),
    transparent;
}

@media (max-width: 390px) {
  .article-detail-view {
    padding-inline: 0;
  }
}
</style>
