const DEFAULT_AUTH_REDIRECT = '/about'

function decodeRedirect(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}

// 仅允许本站绝对路径，拒绝浏览器可解释为外站地址的斜杠变体。
export function resolveAuthRedirect(input: unknown, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof input !== 'string') {
    return fallback
  }

  const redirect = input.trim()
  const decoded = decodeRedirect(redirect)
  if (
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('\\') ||
    !decoded ||
    decoded.startsWith('//') ||
    decoded.includes('\\')
  ) {
    return fallback
  }

  return redirect
}
