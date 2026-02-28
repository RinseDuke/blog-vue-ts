<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

let submitTimer: ReturnType<typeof setTimeout> | null = null

const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))
const isPasswordValid = computed(() => password.value.length >= 6)
const canSubmit = computed(() => isEmailValid.value && isPasswordValid.value && !isSubmitting.value)

function handleSubmit() {
  if (!canSubmit.value) {
    errorMessage.value = '请输入有效邮箱和至少 6 位密码。'
    successMessage.value = ''
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  submitTimer = setTimeout(() => {
    const payload = {
      email: normalizedEmail.value,
      rememberMe: rememberMe.value,
      loggedAt: new Date().toISOString(),
      token: `mock-token-${Date.now()}`,
    }

    if (rememberMe.value) {
      localStorage.setItem('blog_auth_session_v1', JSON.stringify(payload))
    } else {
      sessionStorage.setItem('blog_auth_session_v1', JSON.stringify(payload))
    }

    isSubmitting.value = false
    successMessage.value = '登录成功，正在跳转...'

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    window.location.href = router.resolve(redirect).href
  }, 500)
}

onBeforeUnmount(() => {
  if (!submitTimer) return
  clearTimeout(submitTimer)
  submitTimer = null
})
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="login-card__eyebrow">Account</p>
      <h1>登录</h1>
      <p class="login-card__hint">输入账号信息后即可进入系统。</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>邮箱</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="you@example.com" />
        </label>

        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="至少 6 位" />
        </label>

        <label class="check-row">
          <input v-model="rememberMe" type="checkbox" />
          <span>记住登录状态</span>
        </label>

        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="feedback feedback--success">{{ successMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="!canSubmit">
          {{ isSubmitting ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="login-card__note">当前为前端模拟登录，后续可直接替换为真实接口。</p>
    </div>
  </section>
</template>

<style scoped lang="less">
.login-page {
  width: 100%;
  min-height: calc(100vh - 180px);
  padding: 40px 20px;
  display: grid;
  place-items: center;
}

.login-card {
  width: min(100%, 460px);
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem 1.4rem;

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
  &__note {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.9rem;
  }

  &__note {
    margin-top: 0.9rem;
  }
}

.login-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

  input {
    width: 100%;
    border: 1px solid var(--line-soft);
    border-radius: 10px;
    background: #fff;
    color: var(--ink-strong);
    padding: 0.62rem 0.72rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.35);
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }
  }
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--ink-main);
  font-size: 0.88rem;
}

.feedback {
  margin: 0;
  font-size: 0.87rem;
  font-weight: 600;

  &--error {
    color: var(--danger-500);
  }

  &--success {
    color: var(--success-500);
  }
}

.submit-btn {
  margin-top: 0.15rem;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  color: #fff;
  background: var(--brand-500);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 113, 227, 0.24);
  }

  &:disabled {
    cursor: not-allowed;
    background: #9ca3af;
  }
}
</style>
