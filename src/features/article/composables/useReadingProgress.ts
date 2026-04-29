import { ref, onMounted, onUnmounted } from 'vue'

export function useReadingProgress(containerRef: string) {
  const progress = ref(0)

  let ticking = false

  function handleScroll() {
    if (ticking) return
    ticking = true

    requestAnimationFrame(() => {
      const container = document.querySelector(containerRef)
      if (!container) {
        progress.value = 0
        ticking = false
        return
      }

      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const articleTop = rect.top
      const articleHeight = rect.height

      if (articleHeight <= 0) {
        progress.value = 0
        ticking = false
        return
      }

      const raw = (viewportHeight - articleTop) / (articleHeight + viewportHeight)
      progress.value = Math.min(1, Math.max(0, raw))
      ticking = false
    })
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    progress.value = 0
  })

  return { progress }
}
