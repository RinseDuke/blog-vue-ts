import source from './PostList.vue?raw'

describe('PostList source contract', () => {
  it('reuses the community topic stream instead of separate article cards', () => {
    expect(source).toContain('TopicList')
    expect(source).toContain('mapPostToTopic')
    expect(source).not.toContain('PostCard')
  })
})
