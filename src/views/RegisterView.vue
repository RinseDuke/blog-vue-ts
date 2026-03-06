<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const verificationCode = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const isSendingCode = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const debugCodePreview = ref('')
const lastSentEmail = ref('')
const resendCountdown = ref(0)

let resendTimer: ReturnType<typeof setInterval> | null = null

const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))
const isPasswordValid = computed(() => password.value.length >= 6)
const isConfirmValid = computed(() => confirmPassword.value === password.value && confirmPassword.value.length > 0)
const isVerificationCodeValid = computed(() => /^\d{6}$/.test(verificationCode.value.trim()))
const canSubmit = computed(
  () => isEmailValid.value && isPasswordValid.value && isConfirmValid.value && isVerificationCodeValid.value && !isSubmitting.value
)
const canSendCode = computed(() => isEmailValid.value && !isSendingCode.value && resendCountdown.value === 0 && !isSubmitting.value)
const sendCodeLabel = computed(() => {
  if (isSendingCode.value) return '发送中...'
  if (resendCountdown.value > 0) return `${resendCountdown.value}s 后重发`
  return '发送验证码'
})
const loginLocation = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { name: 'login', query: { redirect } } : { name: 'login' }
})

watch(normalizedEmail, (nextEmail, prevEmail) => {
  if (!prevEmail || nextEmail === prevEmail) return
  if (!lastSentEmail.value || nextEmail === lastSentEmail.value) return

  lastSentEmail.value = ''
  verificationCode.value = ''
  debugCodePreview.value = ''
  infoMessage.value = '邮箱已变更，请重新发送验证码。'
  stopResendCountdown()
  resendCountdown.value = 0
})

function startResendCountdown(seconds: number) {
  stopResendCountdown()
  resendCountdown.value = seconds

  resendTimer = setInterval(() => {
    resendCountdown.value -= 1
    if (resendCountdown.value <= 0) {
      stopResendCountdown()
      resendCountdown.value = 0
    }
  }, 1000)
}

function stopResendCountdown() {
  if (!resendTimer) return
  clearInterval(resendTimer)
  resendTimer = null
}

async function handleSendCode() {
  if (!isEmailValid.value) {
    errorMessage.value = '请先输入有效邮箱。'
    return
  }

  isSendingCode.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const result = await authStore.sendVerificationCode(normalizedEmail.value)
    lastSentEmail.value = normalizedEmail.value
    infoMessage.value = `验证码已发送至 ${normalizedEmail.value}，5 分钟内有效。`
    debugCodePreview.value = result.debugCode
    startResendCountdown(60)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '验证码发送失败，请稍后重试。'
  } finally {
    isSendingCode.value = false
  }
}

async function handleSubmit() {
  if (!isEmailValid.value) {
    errorMessage.value = '请输入有效邮箱。'
    return
  }

  if (!isPasswordValid.value) {
    errorMessage.value = '密码至少需要 6 位。'
    return
  }

  if (!isConfirmValid.value) {
    errorMessage.value = '两次输入的密码不一致。'
    return
  }

  if (!isVerificationCodeValid.value) {
    errorMessage.value = '请输入 6 位邮箱验证码。'
    return
  }

  if (lastSentEmail.value !== normalizedEmail.value) {
    errorMessage.value = '请先向当前邮箱发送验证码。'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.register({
      email: normalizedEmail.value,
      password: password.value,
      rememberMe: rememberMe.value,
      verificationCode: verificationCode.value,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/about'
    await router.replace(redirect)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '注册失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  stopResendCountdown()
})
</script>

<template>
  <section class="register-page">
    <div class="register-card">
      <p class="register-card__eyebrow">账号</p>
      <h1>邮箱注册</h1>
      <p class="register-card__hint">先接收邮箱验证码，再完成注册并自动进入个人中心。</p>

      <form class="register-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>邮箱</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="name@example.com" />
        </label>

        <label class="field">
          <div class="field__head">
            <span>邮箱验证码</span>
            <button type="button" class="send-code-btn" :disabled="!canSendCode" @click="handleSendCode">
              {{ sendCodeLabel }}
            </button>
          </div>
          <input
            v-model="verificationCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="请输入 6 位验证码"
          />
        </label>

        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="new-password" placeholder="至少 6 位" />
        </label>

        <label class="field">
          <span>确认密码</span>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入密码" />
        </label>

        <label class="check-row">
          <input v-model="rememberMe" type="checkbox" />
          <span>记住登录状态</span>
        </label>

        <p v-if="infoMessage" class="feedback feedback--info">{{ infoMessage }}</p>
        <p v-if="debugCodePreview" class="feedback feedback--info">
          当前为本地模拟发送，验证码：<strong>{{ debugCodePreview }}</strong>
        </p>
        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="!canSubmit">
          {{ isSubmitting ? '注册中...' : '注册并登录' }}
        </button>
      </form>

      <p class="register-card__switch">
        已有账号？
        <RouterLink :to="loginLocation">返回登录</RouterLink>
      </p>
      <p class="register-card__note">真实邮件发送后续可直接替换为后端验证码接口。</p>
    </div>
  </section>
</template>

<style scoped lang="less">
.register-page {
  width: 100%;
  min-height: calc(100vh - 180px);
  padding: 40px 20px;
  display: grid;
  place-items: center;
}

.register-card {
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
  &__note,
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

  &__note {
    margin-top: 0.65rem;
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

.field__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.send-code-btn {
  border: 1px solid var(--line-soft);
  background: var(--surface-strong);
  color: var(--brand-500);
  border-radius: 999px;
  padding: 0.32rem 0.72rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover:enabled {
    border-color: rgba(0, 113, 227, 0.35);
    background: rgba(0, 113, 227, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--ink-muted);
    background: #f3f4f6;
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

  &--info {
    color: var(--brand-500);
  }

  &--error {
    color: var(--danger-500);
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
