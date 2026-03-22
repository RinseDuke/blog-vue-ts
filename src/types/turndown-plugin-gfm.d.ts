declare module 'turndown-plugin-gfm' {
  export const gfm: (...args: any[]) => void
  export const highlightedCodeBlock: (...args: any[]) => void
  export const strikethrough: (...args: any[]) => void
  export const tables: (...args: any[]) => void
  export const taskListItems: (...args: any[]) => void
}
