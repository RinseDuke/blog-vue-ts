import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollCondense() {
  const isCondensed = ref(false)
  const sentinelId = 'scroll-condense-sentinel'
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const sentinel = document.getElementById(sentinelId)
    if (!sentinel) return

    observer = new IntersectionObserver(
      ([entry]) => {
        isCondensed.value = !entry.isIntersecting
      },
      { rootMargin: '0px' }
    )

    observer.observe(sentinel)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { isCondensed }
}
