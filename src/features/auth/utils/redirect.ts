const DEFAULT_AUTH_REDIRECT = '/about'

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
