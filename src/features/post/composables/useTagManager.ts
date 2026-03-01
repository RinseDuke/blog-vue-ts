import { computed, ref } from 'vue'

const PRESET_TAGS = [
  '开发经验',
  'Vue Router',
  'Pinia',
  'TypeScript',
  '性能优化',
  'CSS',
  'JavaScript',
  '前端工程化',
]

const MAX_TAGS = 5

export function useTagManager(onDirty: () => void) {
  const selectedTags = ref<string[]>([])
  const tagInput = ref('')

  const suggestedTags = computed(() =>
    PRESET_TAGS.filter((t) => !selectedTags.value.includes(t)),
  )

  function addTag(tag: string) {
    const normalized = tag.trim()
    if (!normalized) return
    if (selectedTags.value.length >= MAX_TAGS) return
    if (selectedTags.value.includes(normalized)) return
    selectedTags.value.push(normalized)
    onDirty()
  }

  function removeTag(tag: string) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
    onDirty()
  }

  function addCustomTag() {
    const raw = tagInput.value.trim()
    if (raw) addTag(raw)
    tagInput.value = ''
  }

  function restoreTags(tags: string[]) {
    selectedTags.value = tags
  }

  function clearTags() {
    selectedTags.value = []
    tagInput.value = ''
  }

  return {
    selectedTags,
    tagInput,
    suggestedTags,
    maxTags: MAX_TAGS,
    addTag,
    removeTag,
    addCustomTag,
    restoreTags,
    clearTags,
  }
}
