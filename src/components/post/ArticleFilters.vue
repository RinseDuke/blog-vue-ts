<script setup lang="ts">
import { computed } from 'vue'

interface TagOption {
  name: string
  count: number
}

interface DateOption {
  label: string
  value: string
}

const props = defineProps<{
  selectedTag: string
  tagOptions: TagOption[]
  totalPosts: number
  datePreset: string
  dateOptions: DateOption[]
  customStartDate: string
  customEndDate: string
  hasActiveFilters: boolean
  isCustomDateInvalid: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedTag', value: string): void
  (e: 'update:datePreset', value: string): void
  (e: 'update:customStartDate', value: string): void
  (e: 'update:customEndDate', value: string): void
  (e: 'clearFilters'): void
}>()

const selectedTagValue = computed({
  get: () => props.selectedTag,
  set: (value: string) => emit('update:selectedTag', value),
})

const datePresetValue = computed({
  get: () => props.datePreset,
  set: (value: string) => emit('update:datePreset', value),
})

const customStartDateValue = computed({
  get: () => props.customStartDate,
  set: (value: string) => emit('update:customStartDate', value),
})

const customEndDateValue = computed({
  get: () => props.customEndDate,
  set: (value: string) => emit('update:customEndDate', value),
})

function selectTag(tag: string) {
  selectedTagValue.value = tag
}
</script>

<template>
  <aside class="filter-box">
    <header class="filter-box__head">
      <h3>Filters</h3>
      <button type="button" class="filter-reset" :disabled="!hasActiveFilters" @click="emit('clearFilters')">Reset</button>
    </header>

    <section class="filter-group">
      <p class="filter-group__title">Tags</p>
      <div class="filter-tags">
        <button
          type="button"
          class="tag-chip"
          :class="{ 'tag-chip--active': selectedTagValue === 'all' }"
          @click="selectTag('all')"
        >
          <span>All</span>
          <span class="tag-chip__count">{{ totalPosts }}</span>
        </button>

        <button
          v-for="item in tagOptions"
          :key="item.name"
          type="button"
          class="tag-chip"
          :class="{ 'tag-chip--active': selectedTagValue === item.name }"
          @click="selectTag(item.name)"
        >
          <span>#{{ item.name }}</span>
          <span class="tag-chip__count">{{ item.count }}</span>
        </button>
      </div>
    </section>

    <section class="filter-group">
      <p class="filter-group__title">Publish date</p>
      <select v-model="datePresetValue" class="filter-select">
        <option v-for="option in dateOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>

      <div v-if="datePresetValue === 'custom'" class="date-range">
        <label>
          <span>Start date</span>
          <input v-model="customStartDateValue" type="date" />
        </label>
        <label>
          <span>End date</span>
          <input v-model="customEndDateValue" type="date" />
        </label>
      </div>

      <p v-if="isCustomDateInvalid" class="filter-error">End date cannot be earlier than start date.</p>
    </section>
  </aside>
</template>

<style scoped lang="less">
.filter-box {
  background: rgba(255, 255, 255, 0.84);
  border-radius: 20px;
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  padding: 1rem;
  position: sticky;
  top: 88px;

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
  background: #fff;
  color: var(--brand-500);
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    color: #a1a1aa;
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
}

.filter-group + .filter-group {
  margin-top: 1.1rem;
  padding-top: 1.1rem;
  border-top: 1px dashed var(--line-soft);
}

.filter-group__title {
  margin: 0;
  font-weight: 700;
  color: var(--ink-strong);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.85);
  color: var(--ink-main);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    border-color: rgba(0, 113, 227, 0.35);
    color: var(--brand-500);
  }
}

.tag-chip--active {
  border-color: transparent;
  background: var(--brand-500);
  color: #fff;
}

.tag-chip__count {
  font-size: 0.8rem;
  opacity: 0.85;
}

.filter-select {
  width: 100%;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: #fff;
  color: var(--ink-strong);
}

.date-range {
  display: grid;
  gap: 0.6rem;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: #475569;
    color: var(--ink-muted);
    font-size: 0.85rem;
  }

  input {
    border: 1px solid var(--line-soft);
    border-radius: 10px;
    padding: 0.5rem 0.6rem;
    color: var(--ink-strong);
  }
}

.filter-error {
  margin: 0;
  color: #dc2626;
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
