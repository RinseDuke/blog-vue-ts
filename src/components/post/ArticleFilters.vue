<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { DatePreset, SortMode } from '@/features/post/utils/articleListQuery'

const props = defineProps<{
  datePreset: DatePreset
  dateOptions: { label: string; value: DatePreset }[]
  sortMode: SortMode
  sortOptions: { label: string; value: SortMode }[]
  customStartDate: string
  customEndDate: string
  hasActiveFilters: boolean
  isCustomDateInvalid: boolean
}>()

const emit = defineEmits<{
  'update:datePreset': [value: DatePreset]
  'update:sortMode': [value: SortMode]
  'update:customStartDate': [value: string]
  'update:customEndDate': [value: string]
  clearFilters: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const panelMaxHeight = ref(600)
const panelId = useId()
const quickSorts: { label: string; value: SortMode }[] = [
  { label: '最新', value: 'newest' },
  { label: '热门', value: 'popular' },
]
const otherSortLabel = computed(() =>
  quickSorts.some((option) => option.value === props.sortMode)
    ? ''
    : props.sortOptions.find((option) => option.value === props.sortMode)?.label
)
const dateLabel = computed(() =>
  props.dateOptions.find((option) => option.value === props.datePreset)?.label ?? '全部时间'
)
const sortValue = computed({
  get: () => props.sortMode,
  set: (value: SortMode) => emit('update:sortMode', value),
})
const startValue = computed({
  get: () => props.customStartDate,
  set: (value: string) => emit('update:customStartDate', value),
})
const endValue = computed({
  get: () => props.customEndDate,
  set: (value: string) => emit('update:customEndDate', value),
})

async function togglePanel() {
  if (isOpen.value) {
    closePanel()
    return
  }
  isOpen.value = true
  await nextTick()
  updatePanelHeight()
  panelRef.value?.querySelector<HTMLButtonElement>('button')?.focus()
}

function updatePanelHeight() {
  if (!isOpen.value || !rootRef.value) return
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  panelMaxHeight.value = Math.max(120, Math.min(600, viewportHeight - rootRef.value.getBoundingClientRect().bottom - 24))
}

function resetFilters() {
  emit('clearFilters')
  void nextTick(() => triggerRef.value?.focus())
}

function closePanel(restoreFocus = true) {
  isOpen.value = false
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus())
}

function onOutsidePointer(event: PointerEvent) {
  if (event.target instanceof Node && !rootRef.value?.contains(event.target)) closePanel(false)
}

function onFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !rootRef.value?.contains(event.relatedTarget)) closePanel(false)
}

watch(() => [props.datePreset, props.customStartDate, props.customEndDate, props.hasActiveFilters], () => {
  void nextTick(updatePanelHeight)
})

onMounted(() => {
  document.addEventListener('pointerdown', onOutsidePointer)
  window.addEventListener('resize', updatePanelHeight)
  window.addEventListener('scroll', updatePanelHeight, { passive: true })
  window.visualViewport?.addEventListener('resize', updatePanelHeight)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutsidePointer)
  window.removeEventListener('resize', updatePanelHeight)
  window.removeEventListener('scroll', updatePanelHeight)
  window.visualViewport?.removeEventListener('resize', updatePanelHeight)
})
</script>

<template>
  <div ref="rootRef" class="article-toolbar" @keydown.esc.stop.prevent="closePanel()" @focusout="onFocusOut">
    <div class="article-toolbar__sorts" role="group" aria-label="主题排序">
      <button
        v-for="option in quickSorts"
        :key="option.value"
        type="button"
        class="article-toolbar__sort"
        :class="{ 'is-selected': sortMode === option.value }"
        :aria-pressed="sortMode === option.value"
        @click="emit('update:sortMode', option.value)"
      >{{ option.label }}</button>
      <span v-if="otherSortLabel" class="article-toolbar__sort-summary" :title="otherSortLabel">{{ otherSortLabel }}</span>
    </div>

    <div class="article-toolbar__actions">
      <button v-if="hasActiveFilters" type="button" class="article-toolbar__reset" @click="resetFilters">重置</button>
      <button
        ref="triggerRef"
        type="button"
        class="article-toolbar__filter"
        :class="{ 'is-filtered': datePreset !== 'all' }"
        :aria-expanded="isOpen"
        :aria-controls="panelId"
        aria-haspopup="dialog"
        @click="togglePanel"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path d="M4 7h16M4 17h16M9 4v6M15 14v6" />
        </svg>
        <span>{{ datePreset === 'all' ? '筛选' : dateLabel }}</span>
        <span v-if="datePreset !== 'all'" class="article-toolbar__dot" aria-hidden="true"></span>
      </button>
    </div>

    <section
      v-if="isOpen"
      :id="panelId"
      ref="panelRef"
      class="filter-popover"
      :style="{ maxHeight: panelMaxHeight + 'px' }"
      role="dialog"
      :aria-labelledby="panelId + '-title'"
    >
      <header class="filter-popover__heading">
        <h2 :id="panelId + '-title'">筛选主题</h2>
        <button type="button" class="filter-popover__close" aria-label="关闭筛选" @click="closePanel()">×</button>
      </header>
      <fieldset class="filter-popover__dates">
        <legend>发布时间</legend>
        <div class="filter-popover__presets">
          <button
            v-for="option in dateOptions"
            :key="option.value"
            type="button"
            :aria-pressed="datePreset === option.value"
            :class="{ 'is-selected': datePreset === option.value }"
            @click="emit('update:datePreset', option.value)"
          >{{ option.label }}</button>
        </div>
      </fieldset>
      <div v-if="datePreset === 'custom'" class="filter-popover__range">
        <label>
          <span>开始日期</span>
          <input v-model="startValue" type="date" :aria-invalid="isCustomDateInvalid" :aria-describedby="isCustomDateInvalid ? panelId + '-error' : undefined" />
        </label>
        <label>
          <span>结束日期</span>
          <input v-model="endValue" type="date" :aria-invalid="isCustomDateInvalid" :aria-describedby="isCustomDateInvalid ? panelId + '-error' : undefined" />
        </label>
      </div>
      <p v-if="isCustomDateInvalid" :id="panelId + '-error'" class="filter-popover__error" role="alert">结束日期不能早于开始日期。</p>
      <label class="filter-popover__sort">
        <span>更多排序</span>
        <select v-model="sortValue">
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <footer class="filter-popover__footer">
        <span>选择后立即生效</span>
        <button type="button" @click="closePanel()">完成</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.article-toolbar {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.8rem 1.25rem;
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink-main);
  font-family: var(--font-body);
}

.article-toolbar__sorts, .article-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.article-toolbar button, .filter-popover select, .filter-popover input {
  font: inherit;
  font-size: 0.85rem;
}

.article-toolbar button {
  cursor: pointer;
}

.article-toolbar__sort {
  min-height: 36px;
  padding: 0.4rem 0.85rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  font-weight: 500;
}

.article-toolbar__sort.is-selected {
  background: var(--surface-hover);
  color: var(--ink-strong);
  font-weight: 600;
}

.article-toolbar__sort-summary {
  max-width: 13rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-muted);
  font-size: 0.78rem;
}

.article-toolbar__filter {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 36px;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-main);
}

.article-toolbar__filter.is-filtered {
  color: var(--brand-500);
}

.article-toolbar__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.article-toolbar__reset {
  min-height: 36px;
  padding: 0.4rem 0.6rem;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
}

.article-toolbar button:hover {
  color: var(--ink-strong);
  background: var(--surface-hover);
}

.article-toolbar :is(button, select, input):focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 3px;
}

.filter-popover {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 1.25rem;
  z-index: 30;
  width: min(330px, calc(100% - 2rem));
  max-height: min(600px, 70dvh);
  overflow-y: auto;
  box-sizing: border-box;
  padding: 1rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  box-shadow: 0 12px 36px color-mix(in srgb, var(--ink-strong) 10%, transparent);
}

.filter-popover__heading, .filter-popover__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.filter-popover__heading { margin-bottom: 1rem; }
.filter-popover__heading h2 { margin: 0; font-size: 0.9rem; font-weight: 600; }

.filter-popover__close {
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
}

.filter-popover__dates { border: 0; padding: 0; margin: 0; min-width: 0; }
.filter-popover__dates legend, .filter-popover__sort > span, .filter-popover__range label > span {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
  color: var(--ink-muted);
}

.filter-popover__presets { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; }
.filter-popover__presets button {
  min-height: 36px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-main);
  font-size: 0.8rem;
}
.filter-popover__presets .is-selected {
  color: var(--brand-500);
  border-color: color-mix(in srgb, var(--brand-500) 40%, var(--line-soft));
  background: color-mix(in srgb, var(--brand-500) 6%, var(--surface-strong));
}
.filter-popover__range { display: grid; gap: 0.65rem; margin-top: 1rem; }
.filter-popover__range label { min-width: 0; }
.filter-popover__sort { display: block; margin-top: 1rem; }
.filter-popover select, .filter-popover input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 38px;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-main);
  color-scheme: light;
}
:global(:root[data-theme='dark']) .filter-popover :is(select, input) { color-scheme: dark; }
.filter-popover__error { font-size: 0.8rem; color: var(--danger-500); }
.filter-popover__footer { margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid var(--line-soft); }
.filter-popover__footer span { font-size: 0.75rem; color: var(--ink-muted); }
.filter-popover__footer button {
  min-height: 34px;
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  color: var(--ink-main);
}

@media (max-width: 480px) {
  .article-toolbar { padding: 0.65rem 0.8rem; gap: 0.5rem; }
  .article-toolbar__sorts { flex-wrap: wrap; }
  .article-toolbar__sort-summary { flex-basis: 100%; max-width: 9rem; font-size: 0.72rem; }
  .article-toolbar__actions { margin-left: auto; }
  .article-toolbar__sort, .article-toolbar__filter, .article-toolbar__reset { min-height: 40px; }
  .filter-popover { right: 0.75rem; width: calc(100% - 1.5rem); max-height: 65dvh; }
  .filter-popover :is(select, input) { font-size: 16px; }
}
</style>
