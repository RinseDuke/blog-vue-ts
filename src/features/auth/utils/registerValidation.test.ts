import { describe, expect, it } from 'vitest'
import { validateRegisterForm } from '@/features/auth/utils/registerValidation'

describe('validateRegisterForm', () => {
  it('returns field-level errors for invalid register input', () => {
    expect(
      validateRegisterForm({
        username: 'ab',
        nickname: 'A',
        email: 'bad-email',
        password: '1234567',
        confirmPassword: '7654321',
        acceptedTerms: false,
      }),
    ).toEqual({
      username: '用户名需为 3-32 位字母、数字、下划线或连字符。',
      nickname: '昵称需为 2-64 个字符。',
      email: '请输入有效邮箱。',
      password: '密码至少需要 8 位。',
      confirmPassword: '两次输入的密码不一致。',
      acceptedTerms: '请先同意用户协议。',
    })
  })

  it('accepts valid register input after normalizing whitespace and email case', () => {
    expect(
      validateRegisterForm({
        username: ' tester_user ',
        nickname: ' 测试用户 ',
        email: ' TESTER@EXAMPLE.COM ',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        acceptedTerms: true,
      }),
    ).toEqual({})
  })
})
