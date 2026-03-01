<template>
  <div class="publish-panel">
    <div class="publish-panel__inner">
      <h3 class="publish-panel__title">发布设置</h3>

      <!-- Cover Image Upload -->
      <div class="cover-section">
        <span class="section-label">添加封面</span>
        <div class="cover-upload-area">
          <div v-if="coverPreviewUrl" class="cover-preview">
            <img :src="coverPreviewUrl" alt="封面预览" class="cover-preview__img" />
            <button type="button" class="cover-preview__remove" @click="$emit('remove-cover')" title="移除封面">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6">
                <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
              </svg>
            </button>
          </div>
          <button v-else type="button" class="cover-placeholder" @click="$emit('trigger-cover')">
            <svg class="cover-placeholder__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span class="cover-placeholder__text">添加文章封面</span>
          </button>
        </div>
        <p class="cover-hint">图片上传格式支持 JPEG、JPG、PNG</p>
      </div>

      <!-- Tag Manager -->
      <div class="tag-section">
        <span class="section-label">添加标签</span>
        <div class="tag-pills">
          <span v-for="tag in selectedTags" :key="tag" class="tag-pill">
            #{{ tag }}
            <button type="button" class="tag-pill__x" @click="$emit('remove-tag', tag)">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.6">
                <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
              </svg>
            </button>
          </span>
          <span v-if="selectedTags.length < maxTags" class="tag-input-wrap">
            <input
              v-model="internalTagInput"
              class="tag-input"
              type="text"
              placeholder="输入标签后按 Enter"
              maxlength="20"
              @keydown.enter.prevent="handleAddCustomTag"
            />
          </span>
        </div>
        <div v-if="suggestedTags.length && selectedTags.length < maxTags" class="tag-suggestions">
          <button
            v-for="tag in suggestedTags"
            :key="tag"
            type="button"
            class="tag-suggest-btn"
            @click="$emit('add-tag', tag)"
          >+ {{ tag }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  coverPreviewUrl: string | null
  selectedTags: string[]
  suggestedTags: string[]
  maxTags: number
  tagInput: string
}>()

const emit = defineEmits<{
  (e: 'remove-cover'): void
  (e: 'trigger-cover'): void
  (e: 'remove-tag', tag: string): void
  (e: 'add-tag', tag: string): void
  (e: 'add-custom-tag'): void
  (e: 'update:tagInput', value: string): void
}>()

const internalTagInput = ref(props.tagInput)

watch(internalTagInput, (val) => {
  emit('update:tagInput', val)
})

watch(() => props.tagInput, (val) => {
  if (val !== internalTagInput.value) {
    internalTagInput.value = val
  }
})

function handleAddCustomTag() {
  emit('add-custom-tag')
}
</script>

<style scoped lang="less">
.publish-panel {
    border-top: 1px solid #eaeff6;
    background: #fff;
    width: 100%;
}

.publish-panel__inner {
    max-width: 820px;
    width: 100%;
    margin: 0 auto;
    padding: 22px 24px 26px;
}

.publish-panel__title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink-strong, #0f172a);
    margin-bottom: 18px;
}

.section-label {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--brand-500);
    margin-bottom: 8px;
}

.cover-section {
    margin-bottom: 20px;
}

.cover-upload-area {
    display: inline-block;
    position: relative;
}

.cover-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 168px;
    height: 112px;
    border: 1.5px dashed #c4cdd9;
    border-radius: 10px;
    background: #fafbfd;
    cursor: pointer;
    gap: 6px;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;

    &:hover {
        border-color: var(--brand-400);
        background: rgba(0, 113, 227, 0.035);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
}

.cover-placeholder__icon {
    color: #94a3b8;
}

.cover-placeholder__text {
    font-size: 0.76rem;
    color: #94a3b8;
}

.cover-preview {
    position: relative;
    width: 168px;
    height: 112px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__remove {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        color: #fff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 0.18s, transform 0.18s;
    }

    &:hover .cover-preview__remove {
        opacity: 1;
        transform: scale(1);
    }
}

.cover-hint {
    margin-top: 8px;
    font-size: 0.76rem;
    color: var(--brand-400);
}

.tag-section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.tag-pills {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--brand-100);
    color: var(--brand-500);
    font-weight: 600;
    font-size: 0.82rem;
    white-space: nowrap;
    animation: pill-pop 0.2s cubic-bezier(.34, 1.56, .64, 1);
}

@keyframes pill-pop {
    from {
        opacity: 0;
        transform: scale(0.7);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.tag-pill__x {
    background: none;
    border: none;
    color: var(--brand-500);
    cursor: pointer;
    padding: 0 1px;
    opacity: 0.5;
    display: inline-flex;
    align-items: center;
    transition: opacity 0.15s;

    &:hover {
        opacity: 1;
    }
}

.tag-input-wrap {
    display: inline-flex;
}

.tag-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.84rem;
    color: var(--ink-main);
    width: 142px;
    padding: 3px 0;

    &::placeholder {
        color: #9ea8ba;
    }
}

.tag-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.tag-suggest-btn {
    background: none;
    border: 1px dashed var(--line-strong);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 0.79rem;
    color: var(--ink-muted);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
        border-color: var(--brand-400);
        color: var(--brand-500);
        background: rgba(0, 113, 227, 0.04);
    }
}

@media (max-width: 768px) {
    .publish-panel__inner {
        padding-left: 14px;
        padding-right: 14px;
    }
}
</style>
