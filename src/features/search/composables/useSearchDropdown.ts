/**
 * 搜索下拉面板 Composable
 * 管理搜索框下拉面板的显示/隐藏、外部点击关闭、搜索触发、建议选择等行为。
 */

import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface UseSearchDropdownOptions {
  normalizedQuery: Ref<string>
  getCurrentInput: () => string
  onSearch: (term: string) => void
  setInputValue?: (value: string) => void
  allowEmptySearch?: boolean
}

export function useSearchDropdown(options: UseSearchDropdownOptions) {
  const showDropdown = ref(false)                       // 下拉可见状态
  const inputEl = ref<HTMLElement | null>(null)           // 输入框 DOM 引用
  const dropdownEl = ref<HTMLElement | null>(null)        // 下拉面板 DOM 引用

  function openDropdown() {
    showDropdown.value = true
  }

  function closeDropdown() {
    showDropdown.value = false
  }

  /** 触发搜索（关闭下拉 + 回调） */
  function triggerSearch() {
    const term = options.getCurrentInput().trim()
    if (!term && !options.allowEmptySearch) return

    closeDropdown()
    options.onSearch(term)
  }

  /** 点击建议项：填充输入框 + 触发搜索 */
  function selectSuggestion(term: string) {
    options.setInputValue?.(term)
    closeDropdown()
    options.onSearch(term)
  }

  /** 点击下拉和输入框外部时关闭下拉 */
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof Node)) return

    const insideDropdown = dropdownEl.value?.contains(target)
    const insideInput = inputEl.value?.contains(target)

    if (!insideDropdown && !insideInput) {
      closeDropdown()
    }
  }

  // 查询变化时自动打开下拉
  watch(options.normalizedQuery, openDropdown)

  onMounted(() => {
    document.addEventListener('click', handleOutsideClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
  })

  return {
    showDropdown,
    inputEl,
    dropdownEl,
    openDropdown,
    closeDropdown,
    triggerSearch,
    selectSuggestion,
  }
}
