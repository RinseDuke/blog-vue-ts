import { usePasswordVisibility } from '@/features/auth/composables/usePasswordVisibility'

describe('usePasswordVisibility', () => {
  it('starts hidden and toggles the password input presentation', () => {
    const visibility = usePasswordVisibility()

    expect(visibility.inputType.value).toBe('password')
    expect(visibility.toggleLabel.value).toBe('显示密码')

    visibility.toggle()

    expect(visibility.inputType.value).toBe('text')
    expect(visibility.toggleLabel.value).toBe('隐藏密码')
  })
})
