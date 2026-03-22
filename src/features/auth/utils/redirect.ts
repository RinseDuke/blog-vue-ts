/**
 * 认证重定向工具
 * 校验 redirect 参数的安全性，防止跳转到外部站点。
 */

const DEFAULT_AUTH_REDIRECT = '/about'

/**
 * 解析并校验重定向路径
 * 仅允许以 `/` 开头的本站路径，拒绝 `//` 开头的外站跳转
 */
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
