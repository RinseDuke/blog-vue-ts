import { ref } from 'vue'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])

function resetInputValue(input: HTMLInputElement | null | undefined) {
  if (input) {
    input.value = ''
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('封面读取失败，请重试'))
    }

    reader.onerror = () => {
      reject(new Error('封面读取失败，请重试'))
    }

    reader.readAsDataURL(file)
  })
}

export function useCoverUpload(onDirty: () => void) {
  const coverInputRef = ref<HTMLInputElement | null>(null)
  const coverFile = ref<File | null>(null)
  const coverPreviewUrl = ref<string | null>(null)

  function triggerCoverInput() {
    coverInputRef.value?.click()
  }

  async function handleCoverSelect(event: Event): Promise<string | null> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return null

    if (!ACCEPTED_TYPES.has(file.type)) {
      resetInputValue(input)
      return '仅支持 JPEG、JPG、PNG 格式图片'
    }

    try {
      coverFile.value = file
      coverPreviewUrl.value = await readFileAsDataUrl(file)
      onDirty()
      return null
    } catch (err) {
      coverFile.value = null
      coverPreviewUrl.value = null
      return err instanceof Error ? err.message : '封面读取失败，请重试'
    } finally {
      resetInputValue(input)
    }
  }

  function removeCover(options: { markDirty?: boolean } = {}) {
    const { markDirty = true } = options
    coverFile.value = null
    coverPreviewUrl.value = null
    resetInputValue(coverInputRef.value)

    if (markDirty) {
      onDirty()
    }
  }

  function restoreCoverFromUrl(url: string | null) {
    coverFile.value = null
    coverPreviewUrl.value = url && !url.startsWith('blob:') ? url : null
    resetInputValue(coverInputRef.value)
  }

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
