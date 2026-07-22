<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePasswordVisibility } from '@/features/auth/composables/usePasswordVisibility'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const passwordVisibility = usePasswordVisibility()

const normalizedUsername = computed(() => username.value.trim())
const isUsernameValid = computed(() => normalizedUsername.value.length >= 3)
const isPasswordValid = computed(() => password.value.length >= 8)
const canSubmit = computed(() => isUsernameValid.value && isPasswordValid.value && !isSubmitting.value)
const registerLocation = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { name: 'register', query: { redirect } } : { name: 'register' }
})

async function handleSubmit() {
  if (!canSubmit.value) {
    errorMessage.value = '请输入有效用户名和至少 8 位密码。'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.login({
      username: normalizedUsername.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })

    await router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '登录失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-page__brand">
      <div class="login-page__brand-content">
        <svg class="login-page__logo" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <rect width="120" height="120" rx="28" fill="url(#brand-grad)"/>
          <path d="M35 75V45l25 15-25 15z" fill="rgba(255,255,255,0.9)"/>
          <path d="M55 75V45l25 15-25 15z" fill="rgba(255,255,255,0.6)"/>
          <defs><linearGradient id="brand-grad" x1="0" y1="0" x2="120" y2="120"><stop stop-color="var(--brand-400)"/><stop offset="1" stop-color="var(--brand-500)"/></linearGradient></defs>
        </svg>
        <h2>Sign Blog</h2>
        <p>记录思考，分享见解</p>
      </div>
    </div>

    <div class="login-page__form-side">
      <div class="login-card">
        <p class="login-card__eyebrow">账号</p>
        <h1>登录</h1>
        <p class="login-card__hint">使用已注册用户名登录，未注册请先创建账号。</p>

        <form class="login-form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>用户名</span>
            <input v-model="username" type="text" autocomplete="username" placeholder="请输入用户名" />
          </label>

          <label class="field">
            <span>密码</span>
            <div class="field__control">
              <input
                v-model="password"
                :type="passwordVisibility.inputType.value"
                autocomplete="current-password"
                placeholder="至少 8 位"
              />
              <button
                type="button"
                class="field__toggle"
                :aria-label="passwordVisibility.toggleLabel.value"
                @click="passwordVisibility.toggle"
              >
                {{ passwordVisibility.buttonText.value }}
              </button>
            </div>
          </label>

          <label class="check-row">
            <input v-model="rememberMe" type="checkbox" />
            <span>记住登录状态</span>
          </label>

          <p v-if="errorMessage" class="feedback feedback--error" role="alert">{{ errorMessage }}</p>

          <button type="submit" class="submit-btn" :disabled="!canSubmit">
            <span v-if="isSubmitting" class="submit-btn__spinner"></span>
            {{ isSubmitting ? '登录中...' : '登录' }}
          </button>
        </form>

        <p class="login-card__switch">
          还没有账号？
          <RouterLink :to="registerLocation">立即注册</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.login-page {
  width: 100%;
  max-width: 100vw;
  min-height: calc(100vh - 68px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, var(--bg-ambient-cool), transparent 42%),
    radial-gradient(circle at 82% 76%, var(--bg-ambient-warm), transparent 44%);
}

.login-page__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 30%, rgba(47, 143, 255, 0.18), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1), transparent 40%),
    linear-gradient(135deg, var(--brand-500), var(--brand-400));
  padding: 2rem;
}

.login-page__brand-content {
  text-align: center;
  color: var(--on-brand);
}

.login-page__logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.2));
}

.login-page__brand-content h2 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.login-page__brand-content p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.85;
}

.login-page__form-side {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  width: min(100%, 420px);
  min-width: 0;
  padding: clamp(1.35rem, 3vw, 2rem);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-surface);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(145%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(145%);

  h1 {
    margin: 0.25rem 0 0.35rem;
    color: var(--ink-strong);
    font-size: clamp(1.7rem, 3vw, 2.2rem);
    letter-spacing: -0.01em;
  }

  &__eyebrow {
    margin: 0;
    color: var(--brand-500);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 0.78rem;
  }

  &__hint,
  &__switch {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.9rem;
  }

  &__switch {
    margin-top: 0.95rem;

    a {
      color: var(--brand-500);
      font-weight: 700;
    }
  }
}

.login-form {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  span {
    font-size: 0.85rem;
    color: var(--ink-main);
    font-weight: 600;
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  input {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    border: 1px solid var(--control-border);
    border-radius: var(--radius-sm);
    background: var(--control-surface);
    color: var(--ink-strong);
    padding: 0.72rem 4.9rem 0.72rem 0.85rem;
    transition: border-color var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out);

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.35);
      box-shadow: var(--focus-ring);
    }
  }

  &__toggle {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid color-mix(in srgb, var(--line-soft) 92%, transparent);
    border-radius: 999px;
    min-width: 44px;
    min-height: 44px;
    background: var(--control-surface-hover);
    color: var(--ink-main);
    padding: 0.26rem 0.62rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: border-color var(--motion-base) var(--ease-out), color var(--motion-base) var(--ease-out);

    &:hover {
      border-color: rgba(0, 113, 227, 0.24);
      color: var(--brand-500);
    }
  }
}

.check-row {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  gap: 0.55rem;
  color: var(--ink-main);
  font-size: 0.88rem;
  cursor: pointer;

  input {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    accent-color: var(--brand-500);
  }
}

.feedback {
  margin: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--danger-500) 28%, transparent);
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  font-size: 0.87rem;
  font-weight: 600;

  &--error {
    color: var(--danger-500);
  }
}

.submit-btn {
  margin-top: 0.15rem;
  border: none;
  border-radius: var(--radius-sm);
  min-height: 46px;
  padding: 0.75rem 0.9rem;
  font-weight: 700;
  color: var(--on-brand);
  background: linear-gradient(135deg, var(--brand-500), var(--brand-400));
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform var(--motion-base) var(--ease-out-quint), box-shadow var(--motion-base) var(--ease-out-quint);

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0, 113, 227, 0.28);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--ink-muted);
    background: var(--control-disabled);
    box-shadow: none;
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .login-card {
    background: var(--surface-strong);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-md);
  }
}

.submit-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--on-brand) 40%, transparent);
  border-top-color: var(--on-brand);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-page__brand {
    display: none;
  }

  .login-page__form-side {
    min-height: calc(100vh - 68px);
    padding: 1rem;
  }

  .login-card {
    padding: 1.25rem;
  }
}

@media (max-width: 390px) {
  .login-card {
    padding: 1rem;
  }
}
</style>
