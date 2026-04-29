<template>
  <div
    v-show="progress > 0 && progress < 1"
    class="reading-progress"
    :style="{ transform: `scaleX(${progress})` }"
    role="progressbar"
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
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--brand-500);
  transform-origin: left;
  z-index: 50;
  pointer-events: none;
  will-change: transform;
}
</style>
