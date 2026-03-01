import { ref, onBeforeUnmount } from 'vue'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export function useCoverUpload(onDirty: () => void) {
  const coverInputRef = ref<HTMLInputElement | null>(null)
  const coverFile = ref<File | null>(null)
  const coverPreviewUrl = ref<string | null>(null)

  function triggerCoverInput() {
    coverInputRef.value?.click()
  }

  function handleCoverSelect(event: Event): string | null {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return null

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return '仅支持 JPEG、JPG、PNG 格式图片'
    }

    coverFile.value = file
    if (coverPreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl.value)
    }
    coverPreviewUrl.value = URL.createObjectURL(file)
    onDirty()
    return null
  }

  function removeCover() {
    coverFile.value = null
    if (coverPreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl.value)
    }
    coverPreviewUrl.value = null
    if (coverInputRef.value) {
      coverInputRef.value.value = ''
    }
    onDirty()
  }

  function restoreCoverFromUrl(url: string | null) {
    if (url) {
      coverPreviewUrl.value = url
    }
  }

  onBeforeUnmount(() => {
    if (coverPreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl.value)
    }
  })

  return {
    coverInputRef,
    coverFile,
    coverPreviewUrl,
    triggerCoverInput,
    handleCoverSelect,
    removeCover,
    restoreCoverFromUrl,
  }
}
