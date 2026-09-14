# 文章编辑器逐行实时预览实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 将写作页改为源码唯一的逐行实时预览编辑器，并统一支持扩展渲染与网站字体。

**Architecture:** 使用 CodeMirror 维护正文和光标状态，装饰层只改变显示，不改写源码。渲染工具集中处理常用扩展和内容净化，写作预览与文章详情共用同一组件。

**Tech Stack:** Vue 3、TypeScript、CodeMirror 6、markdown-it、DOMPurify、KaTeX、highlight.js、Mermaid、Vitest

---

## 文件结构

- 新建 src/features/post/editor/markdownCommands.ts：纯文本选区命令。
- 新建 src/features/post/editor/markdownCommands.test.ts：命令单元测试。
- 新建 src/features/post/editor/livePreviewDecorations.ts：逐行标记范围与活动状态。
- 新建 src/features/post/editor/livePreviewDecorations.test.ts：装饰规则单元测试。
- 新建 src/components/post/MarkdownLiveEditor.vue：CodeMirror 编辑器封装。
- 新建 src/components/post/MarkdownLiveEditor.test.ts：组件源码与接口约束。
- 新建 src/components/post/MarkdownPreview.vue：统一阅读预览与流程图渲染。
- 修改 src/features/post/utils/writeMarkdown.ts：扩展语法、净化和目录。
- 修改 src/features/post/utils/writeMarkdown.test.ts：扩展渲染测试。
- 修改 src/components/post/EditorToolbar.vue：改为发出源码命令。
- 修改 src/components/post/EditorToolbar.test.ts：工具栏接口测试。
- 修改 src/views/Write.vue：移除富文本双向转换并接入新组件。
- 修改 src/views/Write.test.ts：源码唯一和字体约束。
- 修改 src/components/Article.vue：复用统一预览组件。
- 修改 src/components/Article.test.ts：文章详情渲染约束。
- 修改 src/assets/base.css：增加编辑器标记色变量。
- 修改 package.json 与 package-lock.json：增加编辑和扩展渲染依赖。

### 任务一：安装依赖并锁定扩展渲染行为

**Files:**
- Modify: package.json
- Modify: package-lock.json
- Test: src/features/post/utils/writeMarkdown.test.ts

- [ ] **步骤一：安装编辑器和扩展渲染依赖**

    npm install @codemirror/commands @codemirror/lang-markdown @codemirror/language @codemirror/state @codemirror/view @lezer/highlight highlight.js katex markdown-it-anchor markdown-it-footnote markdown-it-task-lists markdown-it-texmath markdown-it-toc-done-right mermaid

- [ ] **步骤二：先写失败测试**

在 writeMarkdown.test.ts 增加以下断言：

    const fence = String.fromCharCode(96).repeat(3)
    const source = [
      '# 标题',
      '',
      '[[toc]]',
      '',
      '- [x] 已完成',
      '',
      '脚注[^1]',
      '',
      '[^1]: 说明',
      '',
      '$$E = mc^2$$',
      '',
      fence + 'ts',
      'const value = 1',
      fence,
      '',
      fence + 'mermaid',
      'graph LR',
      'A --> B',
      fence,
    ].join('\n')

    const html = renderWriteMarkdownToHtml(source)
    expect(html).toContain('table-of-contents')
    expect(html).toContain('task-list-item')
    expect(html).toContain('footnotes')
    expect(html).toContain('katex')
    expect(html).toContain('hljs')
    expect(html).toContain('language-mermaid')

- [ ] **步骤三：运行测试并确认失败**

    npm run test:run -- src/features/post/utils/writeMarkdown.test.ts

预期：扩展类名断言失败。

### 任务二：实现统一扩展渲染

**Files:**
- Modify: src/features/post/utils/writeMarkdown.ts
- Create: src/types/markdown-plugins.d.ts
- Create: src/components/post/MarkdownPreview.vue
- Test: src/features/post/utils/writeMarkdown.test.ts

- [ ] **步骤一：配置渲染器**

在 writeMarkdown.ts 中配置标题锚点、目录、任务列表、脚注、公式和高亮。渲染函数返回经过 DOMPurify 净化的内容，并为外链补充安全属性。

- [ ] **步骤二：保留流程图代码块**

高亮回调遇到 mermaid 语言时返回转义后的源码和 language-mermaid 类名，其他代码块交给 highlight.js。

- [ ] **步骤三：创建统一预览组件**

MarkdownPreview.vue 接收 source 属性，通过 renderWriteMarkdownToHtml 生成内容。更新后查找 language-mermaid 代码块，替换为图表容器并动态调用 Mermaid 渲染。

- [ ] **步骤四：运行渲染测试**

    npm run test:run -- src/features/post/utils/writeMarkdown.test.ts

预期：全部通过。

### 任务三：实现源码工具栏命令

**Files:**
- Create: src/features/post/editor/markdownCommands.ts
- Create: src/features/post/editor/markdownCommands.test.ts

- [ ] **步骤一：先写失败测试**

覆盖以下命令：

    toggleInlineMark('正文', { from: 0, to: 2 }, '**')
    toggleLinePrefix('正文', { from: 0, to: 0 }, '## ')
    toggleLinePrefix('第一行\n第二行', { from: 0, to: 7 }, '- ')
    insertLink('链接', { from: 0, to: 2 }, 'https://example.com')
    insertTable(...)
    mutateMarkdownTable(..., 'add-row')

断言文本和更新后的选区位置。

- [ ] **步骤二：运行测试并确认失败**

    npm run test:run -- src/features/post/editor/markdownCommands.test.ts

预期：模块不存在。

- [ ] **步骤三：实现纯函数命令**

返回统一结构：

    interface MarkdownEditResult {
      value: string
      selection: { from: number; to: number }
    }

实现加粗、斜体、删除线、标题、列表、引用、代码块、链接、表格、分隔线、清空格式及表格行列操作。

- [ ] **步骤四：运行命令测试**

    npm run test:run -- src/features/post/editor/markdownCommands.test.ts

预期：全部通过。

### 任务四：实现逐行实时预览装饰

**Files:**
- Create: src/features/post/editor/livePreviewDecorations.ts
- Create: src/features/post/editor/livePreviewDecorations.test.ts
- Create: src/components/post/MarkdownLiveEditor.vue
- Create: src/components/post/MarkdownLiveEditor.test.ts

- [ ] **步骤一：先写标记范围失败测试**

覆盖标题、加粗、斜体、删除线、链接、任务列表、引用、行内代码、行内公式和脚注。活动行应返回浅色标记范围，非活动行应返回隐藏标记范围。

- [ ] **步骤二：运行测试并确认失败**

    npm run test:run -- src/features/post/editor/livePreviewDecorations.test.ts

预期：模块不存在。

- [ ] **步骤三：实现纯范围分析**

输出结构：

    interface MarkdownDecorationRange {
      from: number
      to: number
      kind: 'syntax' | 'hidden'
    }

范围只改变显示，不修改文档。

- [ ] **步骤四：创建编辑器组件**

组件接口：

    defineProps<{ modelValue: string; placeholder?: string }>()
    defineEmits<{
      'update:modelValue': [value: string]
      change: []
      'toolbar-state': [state: MarkdownToolbarState]
    }>()

通过 defineExpose 暴露 runCommand 和 focus。活动行显示浅色标记，其他行隐藏常用标记；不增加行边框。正文使用网站正文变量，标记与代码使用等宽字体变量。

- [ ] **步骤五：运行相关测试**

    npm run test:run -- src/features/post/editor/livePreviewDecorations.test.ts src/components/post/MarkdownLiveEditor.test.ts

预期：全部通过。

### 任务五：重构工具栏

**Files:**
- Modify: src/components/post/EditorToolbar.vue
- Modify: src/components/post/EditorToolbar.test.ts

- [ ] **步骤一：先改测试**

断言工具栏不再导入旧富文本编辑器，改为接收 state 并发出 command；保留现有按钮、更多菜单与表格操作。

- [ ] **步骤二：运行测试并确认失败**

    npm run test:run -- src/components/post/EditorToolbar.test.ts

- [ ] **步骤三：修改工具栏接口**

    const props = defineProps<{ state: MarkdownToolbarState }>()
    const emit = defineEmits<{ command: [command: MarkdownCommand, payload?: string] }>()

链接按钮继续询问地址，其余按钮发出对应命令。

- [ ] **步骤四：运行工具栏测试**

    npm run test:run -- src/components/post/EditorToolbar.test.ts

预期：全部通过。

### 任务六：接入写作页

**Files:**
- Modify: src/views/Write.vue
- Modify: src/views/Write.test.ts

- [ ] **步骤一：先改写作页测试**

断言写作页使用 MarkdownLiveEditor 与 MarkdownPreview，不再导入旧富文本编辑器、旧实时预览插件和反向序列化函数。

- [ ] **步骤二：运行测试并确认失败**

    npm run test:run -- src/views/Write.test.ts

- [ ] **步骤三：替换编辑区**

实时模式使用：

    <MarkdownLiveEditor
      ref="liveEditorRef"
      v-model="markdown"
      @change="onDirtyAndAutosave"
      @toolbar-state="toolbarState = $event"
    />

源码模式继续使用文本域，阅读模式使用 MarkdownPreview。模式切换只切换显示，不再转换内容。

- [ ] **步骤四：接入工具栏命令**

    function runEditorCommand(command: MarkdownCommand, payload?: string) {
      liveEditorRef.value?.runCommand(command, payload)
    }

- [ ] **步骤五：发布统一渲染结果**

发布时始终使用 renderWriteMarkdownToHtml(markdown.value)，不读取编辑器页面结构。

- [ ] **步骤六：运行写作页测试**

    npm run test:run -- src/views/Write.test.ts src/features/post/composables/useDraft.test.ts

预期：全部通过。

### 任务七：统一文章详情和字体

**Files:**
- Modify: src/components/Article.vue
- Modify: src/components/Article.test.ts
- Modify: src/assets/base.css

- [ ] **步骤一：先改文章测试**

断言文章详情使用 MarkdownPreview；历史页面结构正文仍通过兼容入口净化显示。

- [ ] **步骤二：运行测试并确认失败**

    npm run test:run -- src/components/Article.test.ts

- [ ] **步骤三：接入统一预览**

检测正文是否为历史页面结构；是则净化后显示，否则交给 MarkdownPreview。保留标题去重逻辑。

- [ ] **步骤四：增加编辑器颜色变量**

在 base.css 增加浅色和深色变量：

    --write-markdown-syntax: #aaa4a0;
    --write-markdown-caret: var(--ink-strong);

深色主题使用对应低对比度颜色。

- [ ] **步骤五：统一字体**

编辑正文使用 var(--font-body)，标题使用 var(--font-display)，标记与代码使用 var(--font-mono)。删除写作页中单独声明的编辑字体栈。

- [ ] **步骤六：运行文章与样式测试**

    npm run test:run -- src/components/Article.test.ts src/assets/base.test.ts

预期：全部通过。

### 任务八：完整验证

**Files:**
- Verify: src/views/Write.vue
- Verify: src/components/post/MarkdownLiveEditor.vue
- Verify: src/components/post/MarkdownPreview.vue
- Verify: src/components/Article.vue

- [ ] **步骤一：运行全部相关测试**

    npm run test:run -- src/features/post/utils/writeMarkdown.test.ts src/features/post/editor/markdownCommands.test.ts src/features/post/editor/livePreviewDecorations.test.ts src/components/post/MarkdownLiveEditor.test.ts src/components/post/EditorToolbar.test.ts src/views/Write.test.ts src/components/Article.test.ts

- [ ] **步骤二：运行完整测试**

    npm run test:run

- [ ] **步骤三：运行类型检查**

    npm run type-check

- [ ] **步骤四：运行生产构建**

    npm run build

- [ ] **步骤五：页面交互检查**

启动预览后检查桌面和移动端、浅色和深色：

- 光标上下移动时仅当前逻辑行显示标记。
- 当前行无额外边框。
- 标记颜色浅于正文。
- 加粗、链接、任务列表、公式、目录、代码和流程图可预览。
- 工具栏命令、撤销重做、草稿保存、导出和发布正常。
- 编辑区字体与网站正文一致。
