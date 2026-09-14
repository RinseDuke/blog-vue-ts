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
  <section class="auth-page login-page">
    <div class="auth-card login-card">
      <span class="auth-card__brand">墨言社区</span>
      <p class="auth-card__eyebrow">社区账户</p>
      <h1>欢迎回来</h1>
      <p class="auth-card__hint">登录后即可发起主题、参与回复并管理你的内容。</p>

      <form class="auth-form login-form" @submit.prevent="handleSubmit">
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

        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="!canSubmit">
          <span v-if="isSubmitting" class="submit-btn__spinner"></span>
          {{ isSubmitting ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="auth-card__switch">
        还没有账号？
        <RouterLink :to="registerLocation">立即注册</RouterLink>
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

.auth-form {
  margin-top: 1.35rem;
  display: grid;
  gap: 0.9rem;
}

.field {
  display: grid;
  gap: 0.38rem;
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
