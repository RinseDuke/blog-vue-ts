import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface UseSearchDropdownOptions {
  normalizedQuery: Ref<string>
  getCurrentInput: () => string
  onSearch: (term: string) => void
  setInputValue?: (value: string) => void
  allowEmptySearch?: boolean
}

export function useSearchDropdown(options: UseSearchDropdownOptions) {
  const showDropdown = ref(false)
  const inputEl = ref<HTMLElement | null>(null)
  const dropdownEl = ref<HTMLElement | null>(null)

  function openDropdown() {
    showDropdown.value = true
  }

  function closeDropdown() {
    showDropdown.value = false
  }

  function triggerSearch() {
    const term = options.getCurrentInput().trim()
    if (!term && !options.allowEmptySearch) return

    closeDropdown()
    options.onSearch(term)
  }

  function selectSuggestion(term: string) {
    options.setInputValue?.(term)
    closeDropdown()
    options.onSearch(term)
  }

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof Node)) return

    const insideDropdown = dropdownEl.value?.contains(target)
    const insideInput = inputEl.value?.contains(target)

    if (!insideDropdown && !insideInput) {
      closeDropdown()
    }
  }

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
    triggerSearch,
    selectSuggestion,
  }
}
