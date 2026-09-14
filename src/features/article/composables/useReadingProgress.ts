import { ref, onMounted, onUnmounted } from 'vue'

export function useReadingProgress() {
  const progress = ref(0)
  let frame: number | null = null
  let resizeObserver: ResizeObserver | undefined
  let mutationObserver: MutationObserver | undefined

  function scheduleUpdate() {
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      const page = document.scrollingElement ?? document.documentElement
      const viewportHeight = page.clientHeight || window.innerHeight
      const scrollableHeight = page.scrollHeight - viewportHeight
      // 正文、评论和页脚都属于整页；无需滚动的页面已完整显示。
      // scrollHeight 是整数，scrollTop 可能带小数，页底允许一个像素的舍入误差。
      progress.value = scrollableHeight <= 0
        ? 1
        : page.scrollTop > 0 && scrollableHeight - page.scrollTop <= 1
          ? 1
          : Math.min(1, Math.max(0, page.scrollTop / scrollableHeight))
    })
  }

  onMounted(() => {
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)
    document.addEventListener('load', scheduleUpdate, true)
    document.fonts?.addEventListener('loadingdone', scheduleUpdate)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(document.documentElement)
      if (document.body) resizeObserver.observe(document.body)
    }
    // 覆盖异步文章、评论及路由内容替换，不监听进度条自身的样式更新。
    mutationObserver = new MutationObserver(scheduleUpdate)
    mutationObserver.observe(document.body ?? document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    scheduleUpdate()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', scheduleUpdate)
    window.removeEventListener('resize', scheduleUpdate)
    window.visualViewport?.removeEventListener('resize', scheduleUpdate)
    document.removeEventListener('load', scheduleUpdate, true)
    document.fonts?.removeEventListener('loadingdone', scheduleUpdate)
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    progress.value = 0
  })

  return { progress }
}
