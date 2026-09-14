import source from './Write.vue?raw'

describe('Write view source contract', () => {
  it('presents writing as a community composer', () => {
    expect(source).toContain('composer-shell')
    expect(source).toContain('发起主题')
    expect(source).toContain('editor-toolbar-wrap')
    expect(source).toContain('editor-main-card')
    expect(source.indexOf('editor-toolbar-wrap')).toBeLessThan(source.indexOf('editor-main-card'))
    expect(source).not.toContain('meta-panel__cover-upload')
    expect(source).not.toContain('点击上传封面')
  })

  it('lets the desktop editor width follow the shared write content max width', () => {
    expect(source).toMatch(/\.editor-main\s*\{[\s\S]*max-width: var\(--write-content-max-width, 980px\);/)
  })

  it('publishes immediately while preserving a visible retry message', () => {
    expect(source).toContain("status: 'published'")
    expect(source).toContain('发布失败，请稍后重试。')
    expect(source).toContain('publishError')
  })

  it('uses the markdown editor and preview components for each writing mode', () => {
    expect(source).toContain('v-show="viewMode !== \'read\'"')
    expect(source).toContain(':source-mode="viewMode === \'source\'"')
    expect(source).not.toContain('<textarea')
    expect(source).toContain('liveEditorRef.value?.resetHistory()')
    expect(source).toContain("import MarkdownLiveEditor from '@/components/post/MarkdownLiveEditor.vue'")
    expect(source).toContain("import MarkdownPreview from '@/components/post/MarkdownPreview.vue'")
    expect(source).toContain("import type { MarkdownCommand } from '@/features/post/editor/markdownCommands'")
    expect(source).toContain("import type { MarkdownToolbarState } from '@/features/post/editor/markdownEditorTypes'")
    expect(source).toContain('const toolbarState = ref<MarkdownToolbarState>')
    expect(source).toContain('const liveEditorRef = ref')
    expect(source).toContain('ref="liveEditorRef"')
    expect(source).toContain('@toolbar-state="toolbarState = $event"')
    expect(source).toContain('<MarkdownPreview')
    expect(source).toContain(':source="markdown"')
  })

  it('keeps markdown as the single publication source', () => {
    expect(source).toContain('const html = renderWriteMarkdownToHtml(markdown.value)')
    expect(source).toContain('markdown: content')
    expect(source).not.toContain('@tiptap/vue-3')
    expect(source).not.toContain('@tiptap/starter-kit')
    expect(source).not.toContain('LivePreviewPlugin')
    expect(source).not.toContain('serializeEditorHtmlToMarkdown')
    expect(source).not.toContain('syncEditorFromMarkdown')
    expect(source).not.toContain('isSyncingEditorContent')
    expect(source).not.toContain('editor.value.getHTML()')
  })

  it('routes toolbar commands through the live editor ref and uses shared fonts', () => {
    expect(source).toMatch(/function runEditorCommand\(command: MarkdownCommand, payload\?: string\)[\s\S]*liveEditorRef\.value\?\.runCommand\(command, payload\)/)
    expect(source).toMatch(/\.editor-canvas--live\s*\{[\s\S]*font-family:\s*var\(--font-body\)/)
    expect(source).toMatch(/\.title-input\s*\{[\s\S]*font-family:\s*var\(--font-display\)/)
    expect(source).toMatch(/\.read-preview\s*\{[\s\S]*font-family:\s*var\(--font-body\)/)
    expect(source).toContain('font-family: var(--font-mono)')
    expect(source).not.toMatch(/JetBrains Mono|Fira Code|Cascadia Code|Consolas/)
  })
})
