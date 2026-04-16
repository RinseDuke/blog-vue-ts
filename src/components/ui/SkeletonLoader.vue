<template>
  <div class="skeleton" :class="`skeleton--${variant}`">
    <div v-if="variant === 'article-detail'" class="skeleton__article">
      <div class="skeleton__bar skeleton__bar--title" />
      <div class="skeleton__row">
        <div class="skeleton__circle" />
        <div class="skeleton__bar skeleton__bar--short" />
      </div>
      <div class="skeleton__bar skeleton__bar--full" />
      <div class="skeleton__bar skeleton__bar--full" />
      <div class="skeleton__bar skeleton__bar--3q" />
      <div class="skeleton__bar skeleton__bar--full" />
      <div class="skeleton__bar skeleton__bar--half" />
    </div>

    <div v-else-if="variant === 'post-card'" class="skeleton__card">
      <div class="skeleton__cover" />
      <div class="skeleton__bar skeleton__bar--title" />
      <div class="skeleton__bar skeleton__bar--full" />
      <div class="skeleton__bar skeleton__bar--3q" />
    </div>

    <div v-else-if="variant === 'comment'" class="skeleton__comment">
      <div class="skeleton__row">
        <div class="skeleton__circle" />
        <div class="skeleton__col">
          <div class="skeleton__bar skeleton__bar--short" />
          <div class="skeleton__bar skeleton__bar--xs" />
        </div>
      </div>
      <div class="skeleton__bar skeleton__bar--full" />
      <div class="skeleton__bar skeleton__bar--3q" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  variant: 'article-detail' | 'post-card' | 'comment'
}>()
</script>

<style scoped>
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  width: 100%;
}

.skeleton__article,
.skeleton__card,
.skeleton__comment {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.skeleton__row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.skeleton__col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.skeleton__bar {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef1f5 25%, #dde3ea 38%, #eef1f5 63%);
  background-size: 800px 100%;
  animation: shimmer 1.6s ease infinite;
}

.skeleton__bar--title {
  height: 22px;
  width: 65%;
  border-radius: 10px;
}

.skeleton__bar--full {
  width: 100%;
}

.skeleton__bar--3q {
  width: 75%;
}

.skeleton__bar--half {
  width: 50%;
}

.skeleton__bar--short {
  width: 120px;
}

.skeleton__bar--xs {
  width: 70px;
  height: 10px;
}

.skeleton__circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, #eef1f5 25%, #dde3ea 38%, #eef1f5 63%);
  background-size: 800px 100%;
  animation: shimmer 1.6s ease infinite;
}

.skeleton__cover {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  background: linear-gradient(90deg, #eef1f5 25%, #dde3ea 38%, #eef1f5 63%);
  background-size: 800px 100%;
  animation: shimmer 1.6s ease infinite;
}
</style>
