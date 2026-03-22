/**
 * 标签管理 Composable
 * 提供预设标签 + 自定义标签的增删管理，最多允许 5 个标签。
 */

import { computed, ref } from 'vue'

/** 预设标签列表 */
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

/** 标签数量上限 */
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
  const selectedTags = ref<string[]>([])   // 已选标签
  const tagInput = ref('')                  // 自定义标签输入框

  /** 过滤掉已选的预设标签，显示可选建议 */
  const suggestedTags = computed(() =>
    PRESET_TAGS.filter((t) => !selectedTags.value.includes(t)),
  )

  /** 添加标签（去重 + 上限检查） */
  function addTag(tag: string) {
    const normalized = normalizeTag(tag)
    if (!normalized) return
    if (selectedTags.value.length >= MAX_TAGS) return
    if (selectedTags.value.includes(normalized)) return
    selectedTags.value.push(normalized)
    onDirty()
  }

  /** 移除指定标签 */
  function removeTag(tag: string) {
    const nextTags = selectedTags.value.filter((t) => t !== tag)
    if (nextTags.length === selectedTags.value.length) return
    selectedTags.value = nextTags
    onDirty()
  }

  /** 添加自定义标签并清空输入框 */
  function addCustomTag() {
    const raw = normalizeTag(tagInput.value)
    if (raw) addTag(raw)
    tagInput.value = ''
  }

  /** 从草稿恢复标签 */
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
