<template>
  <div class="write-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar-wrapper">
      <Toolbar
        style="border-bottom: 1px solid #e1e1e1"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
      />
    </div>

    <!-- 主体滚动区域-->
    <div class="main-content">
      <!-- 白纸区域 -->
      <div class="paper-area">
        
        <!-- 标题输入-->
        <input 
          v-model="title" 
          class="paper-title" 
          type="text" 
          placeholder="请输入标题..."
          maxlength="100"
        >
        
        <!-- 分割线 -->
        <div class="divider"></div>

        <!-- 正文编辑器 -->
        <div id="vditor"></div>
      </div>
    </div>

    <!-- 底部发布栏  -->
    <div class="bottom-bar">
      <div class="actions">
        <button class="btn-publish" @click="handlePublish">发布</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef, computed } from 'vue'
// import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

// 编辑器实例
const editorRef = shallowRef()
const vditor = ref<Vditor|null>(null)
const title = ref('')
const valueHtml = ref('')
const mode = 'default' 

const toolbarConfig = {
}

// 编辑器配置
const editorConfig = { 
  placeholder: '请输入正文内容...',
  MENU_CONF: {}
}


const textLength = computed(() => {
  return editorRef.value ? editorRef.value.getText().replace(/\n|\r/mg, '').length : 0
})

onMounted(() => {
  vditor.value = new Vditor('vditor', {
    height: '70vh',
    mode: 'ir', 
    placeholder: '开始记录你的想法...',
    outline: { enable: true, position: 'right' }, // 开启大纲
    cache: { enable: false },
    toolbarConfig: { hide: false },
    // 自定义工具栏
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', '|',
      'upload', 'link', 'table', '|',
      'undo', 'redo', 'fullscreen', 'edit-mode'
    ]
  })
})

onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor
}

const handlePublish = () => {
  const content = vditor.value?.getValue() // 获取的是 Markdown 文本
  console.log('标题:', title.value)
  console.log('Markdown内容:', content)
}
</script>

<style scoped>
.write-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f5f5;
  /* 整体背景灰 */
}

/* 工具栏固定在顶部 */
.toolbar-wrapper {
  background-color: #fff;
  z-index: 100;
}

/* 中间滚动区域 */
.main-content {
  flex: 1;
  overflow-y: auto;
  /* 允许垂直滚动 */
  display: flex;
  justify-content: center;
  /* 水平居中 */
  padding: 20px 0;
}

/* 模拟白纸 */
.paper-area {
  width: 800px;
  /* 限制宽度，像A4纸或知乎文章页 */
  max-width: 95%;
  background-color: #fff;
  min-height: 800px;
  /* 最小高度 */
  padding: 40px 50px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 标题样式 */
.paper-title {
  font-size: 32px;
  font-weight: 600;
  border: none;
  outline: none;
  width: 100%;
  line-height: 1.5;
  color: #333;
  margin-bottom: 10px;
}

.paper-title::placeholder {
  color: #ccc;
  font-weight: 400;
}

.divider {
  height: 1px;
  background-color: #e8e8e8;
  margin-bottom: 20px;
}

.editor-wrapper {
  flex: 1;
  /* 占满剩余空间 */
}

/* 底部栏 */
.bottom-bar {
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #e1e1e1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 40px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-publish {
  background-color: #1e80ff;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-draft {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}

/* 隐藏 Vditor 的边框以获得沉浸式“纸张”感 */
:deep(.vditor) {
  border: none !important;
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid #eee !important;
  background-color: transparent !important;
}
</style>
