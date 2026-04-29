<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')

const normalizedUsername = computed(() => username.value.trim())
const normalizedNickname = computed(() => nickname.value.trim())
const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const isUsernameValid = computed(() => /^[A-Za-z0-9_-]{3,32}$/.test(normalizedUsername.value))
const isNicknameValid = computed(() => normalizedNickname.value.length >= 2 && normalizedNickname.value.length <= 64)
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))
const isPasswordValid = computed(() => password.value.length >= 8)
const isConfirmValid = computed(() => confirmPassword.value === password.value && confirmPassword.value.length > 0)
const canSubmit = computed(
  () =>
    isUsernameValid.value &&
    isNicknameValid.value &&
    isEmailValid.value &&
    isPasswordValid.value &&
    isConfirmValid.value &&
    !isSubmitting.value,
)
const loginLocation = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { name: 'login', query: { redirect } } : { name: 'login' }
})

async function handleSubmit() {
  if (!isUsernameValid.value) {
    errorMessage.value = '用户名需为 3-32 位字母、数字、下划线或连字符。'
    return
  }

  if (!isNicknameValid.value) {
    errorMessage.value = '昵称需为 2-64 个字符。'
    return
  }

  if (!isEmailValid.value) {
    errorMessage.value = '请输入有效邮箱。'
    return
  }

  if (!isPasswordValid.value) {
    errorMessage.value = '密码至少需要 8 位。'
    return
  }

  if (!isConfirmValid.value) {
    errorMessage.value = '两次输入的密码不一致。'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.register({
      username: normalizedUsername.value,
      nickname: normalizedNickname.value,
      email: normalizedEmail.value,
      password: password.value,
      rememberMe: rememberMe.value,
      visibility: 'public',
    })

    await router.replace(resolveAuthRedirect(route.query.redirect))
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '注册失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="register-page">
    <div class="register-page__brand">
      <div class="register-page__brand-content">
        <svg class="register-page__logo" viewBox="0 0 120 120" fill="none" aria-hidden="true">
          <rect width="120" height="120" rx="28" fill="url(#brand-grad-reg)"/>
          <path d="M35 75V45l25 15-25 15z" fill="rgba(255,255,255,0.9)"/>
          <path d="M55 75V45l25 15-25 15z" fill="rgba(255,255,255,0.6)"/>
          <defs><linearGradient id="brand-grad-reg" x1="0" y1="0" x2="120" y2="120"><stop stop-color="var(--brand-400)"/><stop offset="1" stop-color="var(--brand-500)"/></linearGradient></defs>
        </svg>
        <h2>加入 Sign Blog</h2>
        <p>开始你的创作之旅</p>
      </div>
    </div>

    <div class="register-page__form-side">
      <div class="register-card">
        <p class="register-card__eyebrow">账号</p>
        <h1>注册</h1>

        <form class="register-form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>用户名</span>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              maxlength="32"
              placeholder="3-32 位，仅限字母、数字、_、-"
            />
          </label>

          <label class="field">
            <span>昵称</span>
            <input v-model="nickname" type="text" maxlength="64" placeholder="请输入昵称" />
          </label>

          <label class="field">
            <span>邮箱</span>
            <input v-model="email" type="email" autocomplete="email" placeholder="name@example.com" />
          </label>

          <label class="field">
            <span>密码</span>
            <input v-model="password" type="password" autocomplete="new-password" placeholder="至少 8 位" />
          </label>

          <label class="field">
            <span>确认密码</span>
            <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入密码" />
          </label>

          <label class="check-row">
            <input v-model="rememberMe" type="checkbox" />
            <span>记住登录状态</span>
          </label>

          <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

          <button type="submit" class="submit-btn" :disabled="!canSubmit">
            <span v-if="isSubmitting" class="submit-btn__spinner"></span>
            {{ isSubmitting ? '注册中...' : '注册并登录' }}
          </button>
        </form>

        <p class="register-card__switch">
          已有账号？
          <RouterLink :to="loginLocation">返回登录</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="less">
.register-page {
  width: 100%;
  min-height: calc(100vh - 68px);
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.register-page__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 30%, rgba(47, 143, 255, 0.18), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1), transparent 40%),
    linear-gradient(135deg, var(--brand-500), var(--brand-400));
  padding: 2rem;
}

.register-page__brand-content {
  text-align: center;
  color: white;
}

.register-page__logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.2));
}

.register-page__brand-content h2 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.register-page__brand-content p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.85;
}

.register-page__form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.register-card {
  width: min(100%, 460px);
  padding: 0;

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

.register-form {
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
    border-radius: var(--radius-sm);
    background: var(--surface-strong);
    color: var(--ink-strong);
    padding: 0.62rem 0.72rem;
    transition: border-color var(--motion-base) var(--ease-out), box-shadow var(--motion-base) var(--ease-out);

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.35);
      box-shadow: var(--focus-ring);
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
}

.submit-btn {
  margin-top: 0.15rem;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.75rem 0.9rem;
  font-weight: 700;
  color: #fff;
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
    opacity: 0.5;
  }
}

.submit-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .register-page {
    grid-template-columns: 1fr;
  }

  .register-page__brand {
    display: none;
  }

  .register-page__form-side {
    min-height: calc(100vh - 68px);
    padding: 2rem 1.25rem;
  }
}
</style>
