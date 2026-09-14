import sectionSource from './CommentSection.vue?raw'
import itemSource from './CommentItem.vue?raw'

describe('community reply layout', () => {
  it('presents comments as a continuous reply timeline', () => {
    expect(sectionSource).toContain('<h3>回复')
    expect(sectionSource).toContain('还没有回复，开始这次讨论吧。')
    expect(itemSource).toContain('grid-template-columns: 88px minmax(0, 1fr);')
    expect(itemSource).not.toContain('linear-gradient')
  })
})
