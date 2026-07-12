// @vitest-environment happy-dom

import source from './RegisterView.vue?raw'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import RegisterView from './RegisterView.vue'

describe('RegisterView source contract', () => {
  it('requires users to opt in to the agreement when the form mounts', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/register', component: RegisterView },
        { path: '/login', name: 'login', component: { template: '<div />' } },
      ],
    })
    await router.push('/register')
    await router.isReady()

    const wrapper = mount(RegisterView, {
      global: { plugins: [createPinia(), router] },
    })

    expect(source).toContain("const acceptedTerms = ref(false)")
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
  })

  it('keeps register submit clickable until the form is submitting', () => {
    expect(source).toContain('<form class="register-form" novalidate @submit.prevent="handleSubmit">')
    expect(source).toContain(':disabled="isSubmitting"')
    expect(source).not.toContain(':disabled="!canSubmit"')
  })

  it('renders validation errors under their own fields', () => {
    expect(source).toContain('showValidationErrors')
    expect(source).toContain('usernameError')
    expect(source).toContain('emailError')
    expect(source).toContain('passwordError')
    expect(source).toContain('confirmPasswordError')
    expect(source).toContain('class="field__error"')
    expect(source).toContain("'field--invalid': usernameError")
    expect(source).toMatch(/&--invalid span \{[\s\S]*color: var\(--danger-500\);/)
  })

  it('keeps username as the only profile name field during registration', () => {
    expect(source).toContain('v-model="username"')
    expect(source).not.toContain('const nickname')
    expect(source).not.toContain('normalizedNickname')
    expect(source).not.toContain('nicknameError')
    expect(source).not.toContain('v-model="nickname"')
    expect(source).not.toContain('<span>昵称</span>')
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
