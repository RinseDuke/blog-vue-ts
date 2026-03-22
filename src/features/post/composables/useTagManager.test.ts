import { useTagManager } from '@/features/post/composables/useTagManager'

describe('useTagManager', () => {
  it('normalizes restored tags, removes duplicates, and respects the max limit', () => {
    const onDirty = vi.fn()
    const { selectedTags, maxTags, restoreTags } = useTagManager(onDirty)

    restoreTags([
      ' Vue ',
      'Vue',
      '',
      'TypeScript',
      'CSS',
      'JavaScript',
      '性能优化',
      'Pinia',
    ])

    expect(selectedTags.value).toEqual(['Vue', 'TypeScript', 'CSS', 'JavaScript', '性能优化'])
    expect(selectedTags.value).toHaveLength(maxTags)
    expect(onDirty).not.toHaveBeenCalled()
  })
})
