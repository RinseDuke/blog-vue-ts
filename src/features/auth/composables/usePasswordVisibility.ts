import { computed, ref } from 'vue'

export function usePasswordVisibility() {
  const isVisible = ref(false)

  const inputType = computed(() => (isVisible.value ? 'text' : 'password'))
  const toggleLabel = computed(() => (isVisible.value ? '隐藏密码' : '显示密码'))
  const buttonText = computed(() => (isVisible.value ? '隐藏' : '显示'))

  function toggle() {
    isVisible.value = !isVisible.value
  }

  return {
    inputType,
    toggleLabel,
    buttonText,
    toggle,
  }
}
