import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const AUTH_KEY = 'blog_auth_session_v1'

export interface AuthSession {
    email: string
    rememberMe: boolean
    loggedAt: string
    token: string
}

export const useAuthStore = defineStore('auth', () => {
    const session = ref<AuthSession | null>(null)

    const isLoggedIn = computed(() => session.value !== null)
    const userEmail = computed(() => session.value?.email ?? '')

    function loadSession() {
        try {
            const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
            if (!raw) return

            const parsed = JSON.parse(raw) as AuthSession
            if (parsed?.token) {
                session.value = parsed
            }
        } catch {
            session.value = null
        }
    }

    function logout() {
        session.value = null
        localStorage.removeItem(AUTH_KEY)
        sessionStorage.removeItem(AUTH_KEY)
    }

    // Auto-load on store creation
    loadSession()

    return {
        session,
        isLoggedIn,
        userEmail,
        loadSession,
        logout,
    }
})
