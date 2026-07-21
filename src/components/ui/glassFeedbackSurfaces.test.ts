// @ts-expect-error The app tsconfig excludes Node built-in declarations used by this test.
import { readFileSync } from 'node:fs'
import loginSource from '@/views/LoginView.vue?raw'
import registerSource from '@/views/RegisterView.vue?raw'
import aboutSource from '@/views/AboutView.vue?raw'
import profileArticlesSource from '@/views/ProfileArticlesView.vue?raw'
import writeSource from '@/views/Write.vue?raw'
import toolbarSource from '@/components/post/EditorToolbar.vue?raw'
import statusBarSource from '@/components/post/StatusBar.vue?raw'
import commentSectionSource from '@/components/comment/CommentSection.vue?raw'
import commentFormSource from '@/components/comment/CommentForm.vue?raw'
import reportDialogSource from '@/components/comment/ReportDialog.vue?raw'
import buttonSource from './Button.vue?raw'
import modalSource from './Modal.vue?raw'
import dropdownSource from './DropdownSelect.vue?raw'
import datePickerSource from './DatePickerInput.vue?raw'
import toastSource from './Toast.vue?raw'
import skeletonSource from './SkeletonLoader.vue?raw'
import backToTopSource from './BackToTop.vue?raw'
import emptyStateSource from './EmptyState.vue?raw'

const baseSource = readFileSync(new URL('../../assets/base.css', import.meta.url), 'utf8')

function extractBlock(source: string, selector: string) {
  const selectorIndex = source.indexOf(selector)
  const openBraceIndex = source.indexOf('{', selectorIndex)

  if (selectorIndex === -1 || openBraceIndex === -1) throw new Error(`Missing block for ${selector}`)

  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(openBraceIndex + 1, index)
  }

  throw new Error(`Unclosed block for ${selector}`)
}

describe('forms, editor and feedback glass contracts', () => {
  it('defines opaque control tokens in light and dark themes', () => {
    const light = extractBlock(baseSource, ':root')
    const dark = extractBlock(baseSource, ":root[data-theme='dark']")

    for (const block of [light, dark]) {
      expect(block).toContain('--control-surface:')
      expect(block).toContain('--control-surface-hover:')
      expect(block).toContain('--control-border:')
      expect(block).toContain('--control-disabled:')
    }
  })

  it('uses one glass form card with opaque 44px controls on auth pages', () => {
    for (const source of [loginSource, registerSource]) {
      const card = extractBlock(source, source === loginSource ? '.login-card' : '.register-card')
      const field = extractBlock(source, '.field {')

      expect(card).toContain('background: var(--glass-surface);')
      expect(card).toContain('backdrop-filter: blur(var(--glass-blur))')
      expect(field).toContain('min-height: 46px;')
      expect(field).toContain('background: var(--control-surface);')
      expect(source).toMatch(/@media \(max-width: 768px\) {[\s\S]*padding: 1rem;/)
    }
  })

  it('uses glass profile and management panels without blurring their inner controls', () => {
    const profilePanel = extractBlock(aboutSource, '.panel')
    const managerPanel = extractBlock(profileArticlesSource, '.panel')

    for (const panel of [profilePanel, managerPanel]) {
      expect(panel).toContain('background: var(--glass-surface);')
      expect(panel).toContain('border: 1px solid var(--glass-border);')
      expect(panel).toContain('backdrop-filter: blur(var(--glass-blur))')
    }
    expect(aboutSource).not.toContain('backdrop-filter: blur(40px)')
  })

  it('keeps the writing canvas opaque while toolbar and dock provide the glass layer', () => {
    const editorCard = extractBlock(writeSource, '.editor-main-card')
    const editorCanvas = extractBlock(writeSource, '.editor-main-card__canvas')
    const toolbarSurface = extractBlock(toolbarSource, '.editor-toolbar__surface')
    const statusRail = extractBlock(statusBarSource, '.status-bar')
    const statusShell = extractBlock(statusBarSource, '.status-bar__shell')

    expect(editorCard).not.toContain('backdrop-filter')
    expect(editorCanvas).toContain('background: var(--control-surface);')
    expect(toolbarSurface).toContain('backdrop-filter: blur(var(--glass-blur))')
    expect(toolbarSource).toMatch(/@media \(max-width: 768px\) {[\s\S]*min-height: 44px;/)
    expect(statusRail).not.toContain('backdrop-filter')
    expect(statusShell).toContain('backdrop-filter: blur(var(--glass-blur))')
    expect(statusBarSource).toMatch(/@media \(max-width: 768px\) {[\s\S]*min-height: 44px;/)
  })

  it('gives comments clear glass panels, opaque inputs and semantic feedback', () => {
    const section = extractBlock(commentSectionSource, '.comment-section')
    const input = extractBlock(commentFormSource, '.comment-form__input')
    const dialog = extractBlock(reportDialogSource, '.report-dialog')

    expect(section).toContain('background: var(--glass-surface);')
    expect(section).toContain('backdrop-filter: blur(var(--glass-blur))')
    expect(input).toContain('background: var(--control-surface);')
    expect(commentFormSource).toContain(':aria-invalid="Boolean(validationError)"')
    expect(commentFormSource).toContain('role="alert"')
    expect(commentFormSource).toMatch(/\.comment-form__btn {[\s\S]*min-height: 44px;/)
    expect(dialog).toContain('background: var(--glass-surface);')
    expect(dialog).toContain('backdrop-filter: blur(var(--glass-blur))')
    expect(reportDialogSource).toContain('role="alert"')
  })

  it('keeps report dialogs modal and keyboard dismissible', () => {
    expect(reportDialogSource).toContain('aria-modal="true"')
    expect(reportDialogSource).toContain('handleEscape')
    expect(reportDialogSource).toContain('document.addEventListener(\'keydown\', handleEscape)')
  })

  it('uses shared glass and control tokens across generic controls', () => {
    expect(extractBlock(buttonSource, '.btn')).toContain('min-height: 44px;')
    expect(extractBlock(buttonSource, '.btn--secondary')).toContain('background: var(--control-surface);')
    expect(extractBlock(modalSource, '.modal {')).toContain('background: var(--glass-surface);')
    expect(extractBlock(dropdownSource, '.dropdown-select__menu')).toContain('background: var(--glass-surface);')
    expect(extractBlock(datePickerSource, '.date-picker__panel')).toContain('background: var(--glass-surface);')
    expect(extractBlock(toastSource, '.toast {')).toContain('background: var(--glass-surface);')
    expect(skeletonSource).toContain('var(--control-surface-hover)')
    expect(extractBlock(backToTopSource, '.back-to-top {')).toContain('background: var(--glass-surface);')
    expect(extractBlock(emptyStateSource, '.empty-state {')).toContain('background: var(--glass-surface);')
  })

  it('preserves modal teleport, focus trapping and focus restoration', () => {
    expect(modalSource).toContain('<Teleport to="body">')
    expect(modalSource).toContain('modalRef')
    expect(modalSource).toContain('handleTabKey')
    expect(modalSource).toContain('previouslyFocusedElement')
  })
})
