<template>
  <div class="write-page">
    <div class="background-glow"></div>
    <div class="background-grid"></div>

    <div class="editor-shell">
      <div class="shell-header">
        <div class="header-label">Writing Space</div>
        <div class="header-stat">Words {{ textLength }}</div>
      </div>

      <div class="title-area">
        <input
          v-model="title"
          class="paper-title"
          type="text"
          placeholder="Enter title..."
          maxlength="100"
        />
        <div class="divider"></div>
      </div>

      <div class="editor-body">
        <div id="vditor"></div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="actions">
        <button class="btn-publish" @click="handlePublish">Publish</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const vditor = ref<Vditor | null>(null)
const title = ref('')
const textLength = ref(0)

const updateTextLength = () => {
  const content = vditor.value?.getValue() ?? ''
  textLength.value = content.replace(/\s+/g, '').length
}

onMounted(() => {
  vditor.value = new Vditor('vditor', {
    height: 'calc(100vh - 270px)',
    minHeight: 520,
    mode: 'ir',
    placeholder: 'Start writing your thoughts...',
    outline: { enable: true, position: 'right' },
    cache: { enable: false },
    toolbarConfig: { hide: false },
    input: updateTextLength,
    after: updateTextLength,
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'line',
      'quote',
      'list',
      'ordered-list',
      'check',
      '|',
      'code',
      'inline-code',
      '|',
      'upload',
      'link',
      'table',
      '|',
      'undo',
      'redo',
      'fullscreen',
      'edit-mode',
    ],
  })
})

onBeforeUnmount(() => {
  vditor.value?.destroy()
  vditor.value = null
})

const handlePublish = () => {
  const content = vditor.value?.getValue()
  console.log('Title:', title.value)
  console.log('Markdown:', content)
}
</script>

<style scoped>
.write-page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
}

.background-glow {
  display: none;
}

.background-grid {
  display: none;
}

.editor-shell {
  position: relative;
  z-index: 1;
  flex: 1;
  width: min(1460px, calc(100vw - 56px));
  margin: 18px auto 0;
  border-radius: 24px 24px 0 0;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.85);
}

.header-label {
  color: var(--ink-main);
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.header-stat {
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 500;
}

.title-area {
  padding: 28px 46px 14px;
}

.paper-title {
  width: 100%;
  border: none;
  outline: none;
  font-size: clamp(30px, 3.2vw, 42px);
  line-height: 1.3;
  color: var(--ink-strong);
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: transparent;
}

.paper-title:focus {
  color: var(--ink-strong);
}

.paper-title::placeholder {
  color: #b0b0b7;
  font-weight: 400;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.03) 100%);
}

.editor-body {
  flex: 1;
  min-height: 0;
  padding: 0 20px 22px;
}

.bottom-bar {
  position: relative;
  z-index: 2;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid var(--line-soft);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30px;
  backdrop-filter: blur(6px);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-publish {
  background: linear-gradient(135deg, #0071e3 0%, #2f8fff 100%);
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 113, 227, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.btn-publish:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(0, 113, 227, 0.34);
}

:deep(.vditor) {
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid var(--line-soft);
  padding: 8px 10px;
  background: #fbfbfd;
}

:deep(.vditor-ir pre.vditor-reset) {
  padding: 26px 28px 34px;
  font-size: 16px;
  line-height: 1.9;
}

@media (max-width: 900px) {
  .write-page {
    background: #f5f5f7;
  }

  .background-glow,
  .background-grid {
    display: none;
  }

  .editor-shell {
    width: 100%;
    margin: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .shell-header {
    padding: 12px 16px;
  }

  .title-area {
    padding: 20px 18px 10px;
  }

  .editor-body {
    padding: 0 10px 14px;
  }

  .bottom-bar {
    padding: 0 16px;
  }

  :deep(.vditor-ir pre.vditor-reset) {
    padding: 18px 16px 24px;
    font-size: 15px;
  }
}
</style>
