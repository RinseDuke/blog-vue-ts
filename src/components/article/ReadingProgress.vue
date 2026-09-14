<template>
  <div
    class="reading-progress"
    :style="{ transform: `scaleX(${progress})` }"
    role="progressbar"
    aria-label="整页阅读进度"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  />
</template>

<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<style scoped>
.reading-progress {
  position: fixed;
  top: 68px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--brand-500);
  transform-origin: left;
  z-index: 50;
  pointer-events: none;
  will-change: transform;
}

@media (max-width: 768px) {
  .reading-progress {
    top: 52px;
  }
}
</style>
