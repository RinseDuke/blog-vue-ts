import source from './RegisterView.vue?raw'

describe('RegisterView source contract', () => {
  it('keeps register submit clickable until the form is submitting', () => {
    expect(source).toContain('<form class="register-form" novalidate @submit.prevent="handleSubmit">')
    expect(source).toContain(':disabled="isSubmitting"')
    expect(source).not.toContain(':disabled="!canSubmit"')
  })

  it('renders validation errors under their own fields', () => {
    expect(source).toContain('showValidationErrors')
    expect(source).toContain('usernameError')
    expect(source).toContain('nicknameError')
    expect(source).toContain('emailError')
    expect(source).toContain('passwordError')
    expect(source).toContain('confirmPasswordError')
    expect(source).toContain('class="field__error"')
    expect(source).toContain("'field--invalid': usernameError")
    expect(source).toMatch(/&--invalid span \{[\s\S]*color: var\(--danger-500\);/)
  })

  it('uses the password visibility toggle from the password field', () => {
    expect(source).toContain("usePasswordVisibility")
    expect(source).toContain('class="field__toggle"')
    expect(source).toContain('type="button"')
    expect(source).toContain(':type="passwordVisibility.inputType.value"')
    expect(source).toContain(':aria-label="passwordVisibility.toggleLabel.value"')
    expect(source).toContain('@click="passwordVisibility.toggle"')
  })

  it('changes the consent checkbox text to the user agreement', () => {
    expect(source).toContain('同意用户协议')
    expect(source).not.toContain('记住登录状态')
  })
})
