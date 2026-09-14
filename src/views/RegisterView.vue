<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePasswordVisibility } from '@/features/auth/composables/usePasswordVisibility'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'
import { validateRegisterForm } from '@/features/auth/utils/registerValidation'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptedTerms = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showValidationErrors = ref(false)
const passwordVisibility = usePasswordVisibility()

const normalizedUsername = computed(() => username.value.trim())
const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const validationErrors = computed(() =>
  validateRegisterForm({
    username: username.value,
    email: email.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    acceptedTerms: acceptedTerms.value,
  }),
)
const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)
const usernameError = computed(() => (showValidationErrors.value ? validationErrors.value.username : ''))
const emailError = computed(() => (showValidationErrors.value ? validationErrors.value.email : ''))
const passwordError = computed(() => (showValidationErrors.value ? validationErrors.value.password : ''))
const confirmPasswordError = computed(() => (showValidationErrors.value ? validationErrors.value.confirmPassword : ''))
const acceptedTermsError = computed(() => (showValidationErrors.value ? validationErrors.value.acceptedTerms : ''))
const loginLocation = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect ? { name: 'login', query: { redirect } } : { name: 'login' }
})

async function handleSubmit() {
  showValidationErrors.value = true
  errorMessage.value = ''

  if (hasValidationErrors.value) {
    return
  }

  isSubmitting.value = true

  try {
    await authStore.register({
      username: normalizedUsername.value,
      email: normalizedEmail.value,
      password: password.value,
      rememberMe: true,
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
  <section class="auth-page register-page">
    <div class="auth-card register-card">
      <span class="auth-card__brand">墨言社区</span>
      <p class="auth-card__eyebrow">创建社区账户</p>
      <h1>加入讨论</h1>
      <p class="auth-card__hint">创建账号后即可直接发布主题和回复。</p>

      <form class="register-form" novalidate @submit.prevent="handleSubmit">
        <label class="field" :class="{ 'field--invalid': usernameError }">
          <span>用户名</span>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            maxlength="32"
            placeholder="3-32 位，仅限字母、数字、_、-"
            :aria-invalid="Boolean(usernameError)"
          />
          <p v-if="usernameError" class="field__error">{{ usernameError }}</p>
        </label>

        <label class="field" :class="{ 'field--invalid': emailError }">
          <span>邮箱</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :aria-invalid="Boolean(emailError)"
          />
          <p v-if="emailError" class="field__error">{{ emailError }}</p>
        </label>

        <label class="field" :class="{ 'field--invalid': passwordError }">
          <span>密码</span>
          <div class="field__control">
            <input
              v-model="password"
              :type="passwordVisibility.inputType.value"
              autocomplete="new-password"
              placeholder="至少 8 位"
              :aria-invalid="Boolean(passwordError)"
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
          <p v-if="passwordError" class="field__error">{{ passwordError }}</p>
        </label>

        <label class="field" :class="{ 'field--invalid': confirmPasswordError }">
          <span>确认密码</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
            :aria-invalid="Boolean(confirmPasswordError)"
          />
          <p v-if="confirmPasswordError" class="field__error">{{ confirmPasswordError }}</p>
        </label>

        <label class="check-row" :class="{ 'check-row--invalid': acceptedTermsError }">
          <input v-model="acceptedTerms" type="checkbox" />
          <span>同意用户协议</span>
        </label>
        <p v-if="acceptedTermsError" class="field__error">{{ acceptedTermsError }}</p>
        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="submit-btn__spinner"></span>
          {{ isSubmitting ? '注册中...' : '创建账号' }}
        </button>
      </form>

      <p class="auth-card__switch">
        已有账号？
        <RouterLink :to="loginLocation">返回登录</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped lang="less">
.auth-page {
  width: 100%;
  min-height: calc(100vh - 68px);
  padding: 3.5rem 1.25rem;
  display: grid;
  place-items: start center;
  background: var(--bg-canvas);
}

.auth-card {
  width: min(100%, 440px);
  padding: 1.6rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.auth-card__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: var(--ink-strong);
  font-size: 0.82rem;
  font-weight: 680;
}

.auth-card__brand::before {
  content: '墨';
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--ink-strong);
  color: var(--bg-canvas);
  font-size: 0.74rem;
}

.auth-card__eyebrow {
  margin: 0;
  color: var(--brand-500);
  font-size: 0.72rem;
  font-weight: 650;
}

.auth-card h1 {
  margin: 0.3rem 0 0.45rem;
  color: var(--ink-strong);
  font-size: 1.8rem;
  font-weight: 720;
}

.auth-card__hint,
.auth-card__switch {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.auth-card__switch {
  margin-top: 1rem;
  text-align: center;
}

.auth-card__switch a {
  color: var(--brand-500);
  font-weight: 650;
}

.register-form {
  margin-top: 1.35rem;
  display: grid;
  gap: 0.9rem;
}

.field {
  display: grid;
  gap: 0.38rem;

  &--invalid span {
    color: var(--danger-500);
  }
}

.field > span {
  color: var(--ink-main);
  font-size: 0.8rem;
  font-weight: 620;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field input {
  width: 100%;
  min-height: 44px;
  padding: 0 0.8rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--ink-strong);
}

.field__control input {
  padding-right: 4.5rem;
}

.field input:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: var(--focus-ring);
}

.field__toggle {
  position: absolute;
  right: 0.45rem;
  min-height: 30px;
  padding: 0 0.55rem;
  border: 1px solid var(--line-soft);
  border-radius: 7px;
  background: var(--bg-canvas-soft);
  color: var(--ink-muted);
  font-size: 0.72rem;
  cursor: pointer;
}

.field__error,
.feedback {
  margin: 0;
  color: var(--danger-500);
  font-size: 0.75rem;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ink-main);
  font-size: 0.8rem;
}

.submit-btn {
  min-height: 44px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--brand-500);
  color: var(--on-accent);
  font-weight: 680;
  cursor: pointer;
}

.submit-btn:hover:enabled {
  background: var(--brand-400);
}

.submit-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.submit-btn__spinner {
  width: 14px;
  height: 14px;
  display: inline-block;
  margin-right: 0.4rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: auth-spin 0.6s linear infinite;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .auth-page {
    min-height: calc(100vh - 52px);
    padding: 1rem 0.75rem 2rem;
  }

  .auth-card {
    padding: 1.25rem 1rem;
  }
}
</style>
