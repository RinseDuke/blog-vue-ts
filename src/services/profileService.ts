export interface UserProfile {
    displayName: string
    bio: string
    location: string
    joinedAt: string
    lastActive: string
    avatarInitial: string
}

const PROFILE_STORAGE_KEY = 'blog_user_profile_v1'

const defaultProfile: UserProfile = {
    displayName: 'Sign',
    bio: 'I focus on frontend engineering, interface design, and writing workflows to turn complex work into clear execution steps.',
    location: 'Hangzhou',
    joinedAt: '2024-05-12',
    lastActive: 'Today',
    avatarInitial: 'S',
}

class ProfileService {
    async getProfile(): Promise<UserProfile> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300))

        const storedStr = localStorage.getItem(PROFILE_STORAGE_KEY)
        if (storedStr) {
            try {
                return JSON.parse(storedStr) as UserProfile
            } catch (e) {
                console.error('Failed to parse user profile from local storage', e)
            }
        }

        return { ...defaultProfile }
    }

    async updateBio(newBio: string): Promise<UserProfile> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const currentProfile = await this.getProfile()
        const updatedProfile = { ...currentProfile, bio: newBio }

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile))

        return updatedProfile
    }
}

export const profileService = new ProfileService()
