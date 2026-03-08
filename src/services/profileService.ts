import { readStoredAuthSession } from '@/features/auth/stores/useAuthStore'

export interface UserProfile {
    displayName: string
    bio: string
    location: string
    joinedAt: string
    lastActive: string
    avatarInitial: string
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

function buildDefaultProfile(email: string): UserProfile {
    const displayName = normalizeEmailName(email)

    return {
        displayName,
        bio: '专注前端工程、界面设计与写作流程，把复杂工作拆成可执行的步骤。',
        location: '杭州',
        joinedAt: '2024-05-12',
        lastActive: '今天',
        avatarInitial: displayName[0]?.toUpperCase() ?? 'S',
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
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300))
        const session = requireAuthSession('请先登录后再查看个人资料')
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
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        const session = requireAuthSession('请先登录后再更新个人资料')

        const currentProfile = await this.getProfile()
        const updatedProfile = { ...currentProfile, bio: newBio }

        localStorage.setItem(getProfileStorageKey(session.email), JSON.stringify(updatedProfile))

        return updatedProfile
    }
}

export const profileService = new ProfileService()
