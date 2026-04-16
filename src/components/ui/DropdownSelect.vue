<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type DropdownValue = string | number

interface DropdownOption {
  label: string
  value: DropdownValue
}

const props = withDefaults(
  defineProps<{
    modelValue: DropdownValue
    options: DropdownOption[]
    placeholder?: string
  }>(),
  {
    placeholder: 'Select',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: DropdownValue): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const isOpen = ref(false)

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue)
)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function selectOption(value: DropdownValue) {
  emit('update:modelValue', value)
  closeMenu()
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as Node
  if (!rootEl.value?.contains(target)) {
    closeMenu()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="rootEl" class="dropdown-select">
    <button
      type="button"
      class="dropdown-select__trigger"
      :class="{ 'dropdown-select__trigger--open': isOpen }"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <span class="dropdown-select__label">{{ selectedOption?.label ?? placeholder }}</span>
      <svg class="dropdown-select__icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 7.5 10 12.5 15 7.5" />
      </svg>
    </button>

    <transition name="dropdown-fade">
      <div v-if="isOpen" class="dropdown-select__menu" role="listbox">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="dropdown-select__option"
          :class="{ 'dropdown-select__option--active': option.value === modelValue }"
          @click="selectOption(option.value)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="option.value === modelValue" viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5.5 10 2.8 2.8L14.5 6.5" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="less">
.dropdown-select {
  position: relative;
}

.dropdown-select__trigger {
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.62rem 0.78rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(180deg, var(--surface-strong), var(--surface));
  color: var(--ink-strong);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.dropdown-select__trigger:hover,
.dropdown-select__trigger--open {
  border-color: color-mix(in srgb, var(--brand-500) 34%, var(--line-soft));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--brand-100) 70%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.dropdown-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.dropdown-select__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  stroke: currentColor;
  stroke-width: 1.8;
  fill: none;
  transition: transform 0.2s ease;
}

.dropdown-select__trigger--open .dropdown-select__icon {
  transform: rotate(180deg);
}

.dropdown-select__menu {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0.42rem;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 80%, transparent), transparent 40%),
    linear-gradient(180deg, var(--surface-overlay), var(--surface));
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(16px);
}

.dropdown-select__option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.62rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--ink-main);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    flex-shrink: 0;
  }

  &:hover {
    border-color: var(--line-soft);
    background: color-mix(in srgb, var(--surface-strong) 84%, transparent);
    color: var(--ink-strong);
  }
}

.dropdown-select__option--active {
  border-color: color-mix(in srgb, var(--brand-500) 34%, var(--line-soft));
  background: var(--brand-100);
  color: var(--brand-500);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
