export interface RegisterFormInput {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormInput, string>>

export function validateRegisterForm(input: RegisterFormInput): RegisterFormErrors {
  const username = input.username.trim()
  const email = input.email.trim().toLowerCase()
  const errors: RegisterFormErrors = {}

  if (!/^[A-Za-z0-9_-]{3,32}$/.test(username)) {
    errors.username = '用户名需为 3-32 位字母、数字、下划线或连字符。'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '请输入有效邮箱。'
  }

  if (input.password.length < 8) {
    errors.password = '密码至少需要 8 位。'
  }

  if (input.confirmPassword !== input.password || input.confirmPassword.length === 0) {
    errors.confirmPassword = '两次输入的密码不一致。'
  }

  if (!input.acceptedTerms) {
    errors.acceptedTerms = '请先同意用户协议。'
  }

  return errors
}
