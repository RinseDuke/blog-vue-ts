<template>
  <div class="write-page">
    <div class="background-glow"></div>
    <div class="background-grid"></div>

    <div class="editor-shell">
      <div class="shell-header">
        <div class="header-label">写作空间</div>
        <div class="header-stat">字数 {{ textLength }}</div>
      </div>

      <div class="title-area">
        <input
          v-model="title"
          class="paper-title"
          type="text"
          placeholder="请输入标题..."
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
        <button class="btn-publish" @click="handlePublish">发布</button>
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
    placeholder: '开始记录你的想法...',
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
      'edit-mode'
    ]
  })
})

onBeforeUnmount(() => {
  vditor.value?.destroy()
  vditor.value = null
})

const handlePublish = () => {
  const content = vditor.value?.getValue()
  console.log('标题:', title.value)
  console.log('Markdown内容:', content)
}
</script>

<style scoped>
.write-page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(circle at 10% 0%, #eef4ff 0%, #f7f9fd 45%, #f3f5f9 100%);
}

.background-glow {
  position: absolute;
  top: -180px;
  right: -120px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(67, 133, 255, 0.24) 0%, rgba(67, 133, 255, 0) 70%);
  pointer-events: none;
}

.background-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(38, 66, 128, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(38, 66, 128, 0.05) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(circle at center, black 35%, transparent 95%);
  pointer-events: none;
}

.editor-shell {
  position: relative;
  z-index: 1;
  flex: 1;
  width: min(1500px, calc(100vw - 56px));
  margin: 22px auto 0;
  border-radius: 20px 20px 0 0;
  border: 1px solid rgba(190, 205, 235, 0.9);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 26px 50px rgba(31, 59, 119, 0.1);
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
  border-bottom: 1px solid #e6ebf5;
  background: linear-gradient(90deg, #fbfcff 0%, #f5f8ff 100%);
}

.header-label {
  color: #39538a;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.header-stat {
  color: #5f6f8d;
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
  color: #24324d;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: transparent;
}

.paper-title:focus {
  color: #1b2840;
}

.paper-title::placeholder {
  color: #b4bfd5;
  font-weight: 400;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, #dce4f3 0%, #eef2f9 60%, #f5f7fb 100%);
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
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid #dbe4f4;
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
  background: linear-gradient(135deg, #2f75ff 0%, #4f8dff 100%);
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(49, 109, 235, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.btn-publish:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(49, 109, 235, 0.33);
}

:deep(.vditor) {
  border: none;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 30px rgba(21, 47, 97, 0.05);
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid #ecf1fa;
  padding: 8px 10px;
  background: #fafcff;
}

:deep(.vditor-ir pre.vditor-reset) {
  padding: 26px 28px 34px;
  font-size: 16px;
  line-height: 1.9;
}

@media (max-width: 900px) {
  .write-page {
    background: #f5f7fc;
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
