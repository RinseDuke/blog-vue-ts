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

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, ' ')
}

function sanitizeTagList(tags: string[]) {
  const result: string[] = []
  const seen = new Set<string>()

  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (!normalized || seen.has(normalized)) continue

    result.push(normalized)
    seen.add(normalized)

    if (result.length >= MAX_TAGS) break
  }

  return result
}

export function useTagManager(onDirty: () => void) {
  const selectedTags = ref<string[]>([])
  const tagInput = ref('')

  const suggestedTags = computed(() =>
    PRESET_TAGS.filter((t) => !selectedTags.value.includes(t)),
  )

  function addTag(tag: string) {
    const normalized = normalizeTag(tag)
    if (!normalized) return
    if (selectedTags.value.length >= MAX_TAGS) return
    if (selectedTags.value.includes(normalized)) return
    selectedTags.value.push(normalized)
    onDirty()
  }

  function removeTag(tag: string) {
    const nextTags = selectedTags.value.filter((t) => t !== tag)
    if (nextTags.length === selectedTags.value.length) return
    selectedTags.value = nextTags
    onDirty()
  }

  function addCustomTag() {
    const raw = normalizeTag(tagInput.value)
    if (raw) addTag(raw)
    tagInput.value = ''
  }

  function restoreTags(tags: string[]) {
    selectedTags.value = sanitizeTagList(tags)
  }

  function clearTags(options: { markDirty?: boolean } = {}) {
    const { markDirty = false } = options
    if (!selectedTags.value.length && !tagInput.value.trim()) return
    selectedTags.value = []
    tagInput.value = ''

    if (markDirty) {
      onDirty()
    }
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
