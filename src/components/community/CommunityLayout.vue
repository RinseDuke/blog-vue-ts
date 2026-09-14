<script setup lang="ts">
import CommunitySidebar from './CommunitySidebar.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    compact?: boolean
    wideContent?: boolean
  }>(),
  {
    title: '',
    description: '',
    compact: false,
    wideContent: false,
  }
)
</script>

<template>
  <div class="community-layout" :class="{ 'community-layout--compact': compact, 'community-layout--wide': wideContent }">
    <aside class="community-layout__left">
      <CommunitySidebar />
    </aside>

    <main class="community-layout__main">
      <header v-if="title || description" class="community-layout__header">
        <div>
          <h1 v-if="title">{{ title }}</h1>
          <p v-if="description">{{ description }}</p>
        </div>
        <slot name="header-action" />
      </header>
      <slot />
    </main>

    <aside v-if="$slots.context" class="community-layout__right">
      <slot name="context" />
    </aside>
  </div>
</template>

<style scoped lang="less">
.community-layout {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding: 1.75rem 1.25rem 4rem;
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) 250px;
  gap: 1.5rem;
  align-items: start;
}

.community-layout__left,
.community-layout__right,
.community-layout__main {
  min-width: 0;
}

.community-layout--wide {
  max-width: 1160px;
  grid-template-columns: 210px minmax(0, 1fr);
}

.community-layout__main {
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.community-layout--compact .community-layout__main {
  overflow: visible;
}

.community-layout__header {
  min-height: 96px;
  padding: 1.35rem 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--line-soft);
}

.community-layout__header h1 {
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 3vw, 2rem);
  font-weight: 720;
  line-height: 1.2;
}

.community-layout__header p {
  margin: 0.35rem 0 0;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.community-layout__right {
  position: sticky;
  top: 88px;
}

@media (max-width: 1100px) {
  .community-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .community-layout__right {
    position: static;
    grid-column: 2;
    display: block;
  }
}

@media (max-width: 800px) {
  .community-layout {
    display: block;
    padding: 0.85rem 0.75rem 3rem;
  }

  .community-layout__left {
    display: none;
  }

  .community-layout__right {
    position: static;
    display: block;
    margin-top: 0.85rem;
  }

  .community-layout__main {
    border-radius: var(--radius-md);
  }

  .community-layout__header {
    min-height: 0;
    padding: 1.1rem 1rem;
  }
}
</style>
