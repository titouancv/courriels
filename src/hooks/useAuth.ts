import { useState, useEffect } from 'react'
import { supabase, saveUserToSupabase, getUserProfile } from '../lib/supabase'
import { fetchUserInfo as fetchUserInfoService } from '../services/gmailApi'
import type { User } from '../types'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.provider_token) {
                setAccessToken(session.provider_token)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.provider_token) {
                setAccessToken(session.provider_token)
            } else {
                setAccessToken(null)
                setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (!accessToken) return

        const fetchUserInfo = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (session?.user?.id) {
                    const profile = await getUserProfile(session.user.id)

                    if (profile) {
                        setUser({
                            email: profile.email,
                            name: profile.full_name,
                            picture: profile.avatar_url,
                        })
                    } else {
                        const userData = await fetchUserInfoService(accessToken)
                        setUser(userData)
                        await saveUserToSupabase(userData, session.user.id)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user info:', error)
            }
        }

        fetchUserInfo()
    }, [accessToken])

    const logout = async () => {
        await supabase.auth.signOut()
        setAccessToken(null)
        setUser(null)
    }

    return { user, accessToken, loading, logout, setUser }
}
