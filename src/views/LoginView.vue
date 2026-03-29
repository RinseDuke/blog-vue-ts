<!-- 登录页：按后端规范使用用户名 + 密码登录 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { usePasswordVisibility } from '@/features/auth/composables/usePasswordVisibility'
import { DEFAULT_MOCK_LOGIN, useAuthStore } from '@/features/auth/stores/useAuthStore'
import { resolveAuthRedirect } from '@/features/auth/utils/redirect'
import { isMockMode } from '@/services/apiClient'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showMockHint = isMockMode()
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
    <div class="login-card">
      <p class="login-card__eyebrow">账号</p>
      <h1>登录</h1>
      <p class="login-card__hint">使用已注册用户名登录，未注册请先创建账号。</p>
      <p v-if="showMockHint" class="login-card__mock">
        Mock 测试账号：<code>{{ DEFAULT_MOCK_LOGIN.username }}</code> / <code>{{ DEFAULT_MOCK_LOGIN.password }}</code>
      </p>

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

        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="!canSubmit">
          {{ isSubmitting ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="login-card__switch">
        还没有账号？
        <RouterLink :to="registerLocation">立即注册</RouterLink>
      </p>
      <p class="login-card__note">当前页面已按后端规范切换为用户名登录。</p>
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
  &__mock,
  &__note,
  &__switch {
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.9rem;
  }

  &__mock {
    margin-top: 0.65rem;
    padding: 0.7rem 0.8rem;
    border-radius: 14px;
    border: 1px solid var(--line-soft);
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--brand-100) 45%, transparent), transparent 42%),
      linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));

    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.84em;
      color: var(--ink-strong);
    }
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

  &__control {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    width: 100%;
    border: 1px solid var(--line-soft);
    border-radius: 10px;
    background: #fff;
    color: var(--ink-strong);
    padding: 0.62rem 4.9rem 0.62rem 0.72rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(0, 113, 227, 0.35);
      box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
    }
  }

  &__toggle {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid color-mix(in srgb, var(--line-soft) 92%, transparent);
    border-radius: 999px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 98%, transparent), color-mix(in srgb, var(--surface) 96%, transparent));
    color: var(--ink-main);
    padding: 0.26rem 0.62rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      color 0.2s ease,
      background 0.2s ease;

    &:hover {
      border-color: rgba(0, 113, 227, 0.24);
      color: var(--brand-500);
    }

    &:focus-visible {
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
