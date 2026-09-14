declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it'

  const footnote: MarkdownIt.PluginSimple

  export default footnote
}

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'

  interface TaskListOptions {
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }

  const taskLists: MarkdownIt.PluginWithOptions<TaskListOptions>

  export default taskLists
}

declare module 'markdown-it-texmath' {
  import type { KatexOptions } from 'katex'
  import type MarkdownIt from 'markdown-it'

  interface TexmathOptions {
    engine: typeof import('katex')
    delimiters?: string | string[]
    katexOptions?: KatexOptions
    outerSpace?: boolean
  }

  const texmath: MarkdownIt.PluginWithOptions<TexmathOptions>

  export default texmath
}
