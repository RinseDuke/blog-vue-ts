<!-- 文章列表页侧栏筛选器 -->
<script setup lang="ts">
import { computed } from 'vue'
import DropdownSelect from '@/components/ui/DropdownSelect.vue'
import DatePickerInput from '@/components/ui/DatePickerInput.vue'

interface DateOption {
  label: string
  value: string
}

interface SortOption {
  label: string
  value: string
}

const props = defineProps<{
  datePreset: string
  dateOptions: DateOption[]
  sortMode: string
  sortOptions: SortOption[]
  pageSize: number
  pageSizeOptions: number[]
  customStartDate: string
  customEndDate: string
  hasActiveFilters: boolean
  isCustomDateInvalid: boolean
}>()

const emit = defineEmits<{
  (e: 'update:datePreset', value: string): void
  (e: 'update:sortMode', value: string): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:customStartDate', value: string): void
  (e: 'update:customEndDate', value: string): void
  (e: 'clearFilters'): void
}>()

const datePresetValue = computed({
  get: () => props.datePreset,
  set: (value: string) => emit('update:datePreset', value),
})

const sortModeValue = computed({
  get: () => props.sortMode,
  set: (value: string) => emit('update:sortMode', value),
})

const pageSizeValue = computed({
  get: () => props.pageSize,
  set: (value: number) => emit('update:pageSize', value),
})

const pageSizeDropdownOptions = computed(() =>
  props.pageSizeOptions.map((size) => ({
    label: `${size} / 页`,
    value: size,
  }))
)

const customStartDateValue = computed({
  get: () => props.customStartDate,
  set: (value: string) => emit('update:customStartDate', value),
})

const customEndDateValue = computed({
  get: () => props.customEndDate,
  set: (value: string) => emit('update:customEndDate', value),
})
</script>

<template>
  <aside class="filter-box">
    <header class="filter-box__head">
      <h3>筛选</h3>
      <button type="button" class="filter-reset" :disabled="!hasActiveFilters" @click="emit('clearFilters')">重置</button>
    </header>

    <section class="filter-group filter-group--compact">
      <p class="filter-group__title">排序</p>
      <DropdownSelect v-model="sortModeValue" :options="sortOptions" placeholder="选择排序" />
    </section>

    <section class="filter-group filter-group--compact">
      <p class="filter-group__title">每页显示</p>
      <DropdownSelect v-model="pageSizeValue" :options="pageSizeDropdownOptions" placeholder="选择数量" />
    </section>

    <section class="filter-group">
      <p class="filter-group__title">发布时间</p>
      <DropdownSelect v-model="datePresetValue" :options="dateOptions" placeholder="选择时间" />

      <div v-if="datePresetValue === 'custom'" class="date-range">
        <label>
          <span>开始日期</span>
          <DatePickerInput v-model="customStartDateValue" />
        </label>
        <label>
          <span>结束日期</span>
          <DatePickerInput v-model="customEndDateValue" />
        </label>
      </div>

      <p v-if="isCustomDateInvalid" class="filter-error">结束日期不能早于开始日期。</p>
    </section>
  </aside>
</template>

<style scoped lang="less">
.filter-box {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 70%, transparent), transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(14px);
  padding: 1rem;
  position: sticky;
  top: 102px;
  overflow: visible;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--ink-strong);
      font-weight: 700;
    }
  }
}

.filter-reset {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--brand-500);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    color: var(--ink-muted);
    border-color: var(--line-soft);
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    border-color: rgba(0, 113, 227, 0.35);
    background: rgba(0, 113, 227, 0.08);
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--line-soft);
}

.filter-group--compact {
  padding-top: 0;
  border-top: none;
}

.filter-group--compact + .filter-group--compact {
  margin-top: 0.95rem;
}

.filter-group__title {
  margin: 0;
  font-weight: 700;
  color: var(--ink-strong);
}

.date-range {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.2rem;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    color: var(--ink-muted);
    font-size: 0.85rem;
    font-weight: 600;
  }
}

.filter-error {
  margin: 0;
  color: var(--danger-500);
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .filter-box {
    position: static;
    order: -1;
  }
}

</style>
