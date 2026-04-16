const DEFAULT_AUTH_REDIRECT = '/about'

// 仅允许本站路径，拒绝 `//` 开头的外站跳转
export function resolveAuthRedirect(input: unknown, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof input !== 'string') {
    return fallback
  }

  const redirect = input.trim()
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback
  }

  return redirect
}
