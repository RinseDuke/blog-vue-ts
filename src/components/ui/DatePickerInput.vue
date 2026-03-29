<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildCalendarMonth,
  formatDateDisplay,
  formatDateValue,
  parseDateValue,
  shiftCalendarMonth,
} from '@/features/post/utils/calendarDate'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'yyyy/mm/dd',
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const rootEl = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const viewDate = ref(getInitialViewDate(props.modelValue))

const selectedDate = computed(() => parseDateValue(props.modelValue))
const displayValue = computed(() =>
  props.modelValue ? formatDateDisplay(props.modelValue) : props.placeholder
)
const monthLabel = computed(
  () =>
    `${viewDate.value.getFullYear()}年${String(viewDate.value.getMonth() + 1).padStart(2, '0')}月`
)
const calendarDays = computed(() =>
  buildCalendarMonth(viewDate.value).map((day) => ({
    ...day,
    isSelected: day.value === props.modelValue,
  }))
)

watch(
  () => props.modelValue,
  (nextValue) => {
    viewDate.value = getInitialViewDate(nextValue)
  }
)

function getInitialViewDate(value: string) {
  const parsed = parseDateValue(value)
  const fallback = parsed ?? new Date()
  return shiftCalendarMonth(fallback, 0)
}

function togglePicker() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closePicker() {
  isOpen.value = false
}

function goToPreviousMonth() {
  viewDate.value = shiftCalendarMonth(viewDate.value, -1)
}

function goToNextMonth() {
  viewDate.value = shiftCalendarMonth(viewDate.value, 1)
}

function selectDate(value: string) {
  emit('update:modelValue', value)
  closePicker()
}

function clearDate() {
  emit('update:modelValue', '')
  closePicker()
}

function selectToday() {
  emit('update:modelValue', formatDateValue(new Date()))
  closePicker()
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as Node
  if (!rootEl.value?.contains(target)) {
    closePicker()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePicker()
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
  <div ref="rootEl" class="date-picker">
    <button
      type="button"
      class="date-picker__trigger"
      :class="{
        'date-picker__trigger--open': isOpen,
        'date-picker__trigger--placeholder': !modelValue,
      }"
      :aria-expanded="isOpen"
      :disabled="disabled"
      @click="togglePicker"
    >
      <span class="date-picker__value">{{ displayValue }}</span>
      <svg class="date-picker__icon" viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3.25" y="4.5" width="13.5" height="12.25" rx="2.25" />
        <path d="M6.25 3.5v3M13.75 3.5v3M3.75 8.25h12.5M6.75 11.25h1.5M10 11.25h1.5M13.25 11.25h.01M6.75 14.25h1.5M10 14.25h1.5M13.25 14.25h.01" />
      </svg>
    </button>

    <transition name="date-picker-fade">
      <div v-if="isOpen" class="date-picker__panel" role="dialog" aria-label="选择日期">
        <div class="date-picker__head">
          <strong>{{ monthLabel }}</strong>
          <div class="date-picker__nav">
            <button type="button" aria-label="上个月" @click="goToPreviousMonth">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M11.75 4.5 6.25 10l5.5 5.5" />
              </svg>
            </button>
            <button type="button" aria-label="下个月" @click="goToNextMonth">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M8.25 4.5 13.75 10l-5.5 5.5" />
              </svg>
            </button>
          </div>
        </div>

        <div class="date-picker__weekdays">
          <span v-for="weekday in WEEKDAY_LABELS" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="date-picker__grid">
          <button
            v-for="day in calendarDays"
            :key="day.value"
            type="button"
            class="date-picker__day"
            :class="{
              'date-picker__day--outside': !day.isCurrentMonth,
              'date-picker__day--today': day.isToday,
              'date-picker__day--selected': day.isSelected,
            }"
            @click="selectDate(day.value)"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="date-picker__actions">
          <button type="button" class="date-picker__action" @click="clearDate">清除</button>
          <button type="button" class="date-picker__action date-picker__action--today" @click="selectToday">今天</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="less">
.date-picker {
  position: relative;
}

.date-picker__trigger {
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.62rem 0.78rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, var(--surface-strong), var(--surface));
  color: var(--ink-strong);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.date-picker__trigger:hover,
.date-picker__trigger--open {
  border-color: color-mix(in srgb, var(--brand-500) 34%, var(--line-soft));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--brand-100) 70%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.date-picker__trigger--placeholder {
  color: var(--ink-muted);
}

.date-picker__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  text-align: left;
}

.date-picker__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  stroke: currentColor;
  stroke-width: 1.55;
  fill: none;
}

.date-picker__panel {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 0;
  right: 0;
  z-index: 70;
  padding: 0.8rem;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 70%, transparent), transparent 42%),
    linear-gradient(180deg, var(--surface-overlay), color-mix(in srgb, var(--surface) 98%, transparent));
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(16px);
}

.date-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;

  strong {
    color: var(--ink-strong);
    font-size: 0.98rem;
    font-weight: 700;
  }
}

.date-picker__nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;

  button {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line-soft);
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface-strong) 88%, transparent);
    color: var(--ink-main);
    cursor: pointer;
    transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--brand-500) 28%, var(--line-soft));
      background: color-mix(in srgb, var(--brand-100) 60%, transparent);
      color: var(--ink-strong);
    }
  }

  svg {
    width: 15px;
    height: 15px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
  }
}

.date-picker__weekdays,
.date-picker__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.date-picker__weekdays {
  gap: 0.22rem;
  margin-bottom: 0.38rem;

  span {
    text-align: center;
    color: var(--ink-muted);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.2rem 0;
  }
}

.date-picker__grid {
  gap: 0.22rem;
}

.date-picker__day {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-main);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;

  &:hover {
    border-color: var(--line-soft);
    background: color-mix(in srgb, var(--surface-strong) 84%, transparent);
    color: var(--ink-strong);
  }
}

.date-picker__day--outside {
  color: color-mix(in srgb, var(--ink-muted) 78%, transparent);
}

.date-picker__day--today {
  border-color: color-mix(in srgb, var(--brand-500) 24%, var(--line-soft));
  color: var(--brand-500);
}

.date-picker__day--selected {
  border-color: color-mix(in srgb, var(--brand-500) 34%, var(--line-soft));
  background: var(--brand-100);
  color: var(--brand-500);
}

.date-picker__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.8rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line-soft);
}

.date-picker__action {
  border: none;
  background: transparent;
  color: var(--ink-muted);
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease;

  &:hover {
    color: var(--ink-strong);
  }
}

.date-picker__action--today {
  color: var(--brand-500);
}

.date-picker-fade-enter-active,
.date-picker-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.date-picker-fade-enter-from,
.date-picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
