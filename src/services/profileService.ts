import { apiFetch, isMockMode } from '@/services/apiClient'
import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'

export interface UserProfile {
    id: string
    username: string
    email: string
    displayName: string
    bio: string
    joinedAt: string
    lastActive: string
    avatarInitial: string
    avatarUrl?: string
    visibility: 'public' | 'private'
}

interface BackendUserProfile {
    id: string
    username: string
    nickname: string
    email: string
    avatar?: string | null
    bio?: string | null
    created_at?: string | null
    last_login_at?: string | null
    visibility?: 'public' | 'private'
}

const PROFILE_STORAGE_KEY = 'blog_user_profile_v1'

function normalizeEmailName(email: string) {
    return email.split('@')[0]?.trim() || 'Sign'
}

function requireAuthSession(errorMessage: string) {
    const session = readStoredAuthSession()
    if (!session) {
        throw new Error(errorMessage)
    }

    return session
}

function getProfileStorageKey(email: string) {
    return `${PROFILE_STORAGE_KEY}:${email}`
}

function formatProfileDate(value?: string | null) {
    if (!value) return '未记录'

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(value))
}

function mapBackendProfile(profile: BackendUserProfile): UserProfile {
    const displayName = profile.nickname?.trim() || profile.username

    return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        displayName,
        bio: profile.bio?.trim() || '这个账号还没有填写个人简介。',
        joinedAt: formatProfileDate(profile.created_at),
        lastActive: formatProfileDate(profile.last_login_at),
        avatarInitial: displayName[0]?.toUpperCase() ?? 'S',
        avatarUrl: profile.avatar ?? undefined,
        visibility: profile.visibility ?? 'public',
    }
}

function buildDefaultProfile(email: string): UserProfile {
    const displayName = normalizeEmailName(email)

    return {
        id: `user-${email}`,
        username: displayName,
        email,
        displayName,
        bio: '专注前端工程、界面设计与写作流程，把复杂工作拆成可执行的步骤。',
        joinedAt: '2024/05/12',
        lastActive: '今天',
        avatarInitial: displayName[0]?.toUpperCase() ?? 'S',
        visibility: 'public',
    }
}

class ProfileService {
    private readProfileFromStorage(storageKey: string): UserProfile | null {
        const storedStr = localStorage.getItem(storageKey)
        if (!storedStr) {
            return null
        }

        try {
            return JSON.parse(storedStr) as UserProfile
        } catch (e) {
            console.error('Failed to parse user profile from local storage', e)
            return null
        }
    }

    async getProfile(): Promise<UserProfile> {
        const session = requireAuthSession('请先登录后再查看个人资料')

        if (!isMockMode()) {
            const profile = await apiFetch<BackendUserProfile>('/users/me', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: session.user.id,
                }),
            })

            return mapBackendProfile(profile)
        }

        await new Promise((resolve) => setTimeout(resolve, 300))
        const scopedKey = getProfileStorageKey(session.email)

        const scopedProfile = this.readProfileFromStorage(scopedKey)
        if (scopedProfile) {
            return scopedProfile
        }

        const legacyProfile = this.readProfileFromStorage(PROFILE_STORAGE_KEY)
        if (legacyProfile) {
            localStorage.setItem(scopedKey, JSON.stringify(legacyProfile))
            localStorage.removeItem(PROFILE_STORAGE_KEY)
            return legacyProfile
        }

        return buildDefaultProfile(session.email)
    }

    async updateBio(newBio: string): Promise<UserProfile> {
        const session = requireAuthSession('请先登录后再更新个人资料')

        if (!isMockMode()) {
            const updated = await apiFetch<BackendUserProfile>(`/users/${session.user.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    bio: newBio,
                }),
            })

            return mapBackendProfile(updated)
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
        const currentProfile = await this.getProfile()
        const updatedProfile = { ...currentProfile, bio: newBio }

        localStorage.setItem(getProfileStorageKey(session.email), JSON.stringify(updatedProfile))

        return updatedProfile
    }
}

export const profileService = new ProfileService()
