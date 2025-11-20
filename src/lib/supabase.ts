import { createClient } from '@supabase/supabase-js'
import type { User } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveUserToSupabase(user: User, userId: string) {
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: user.email,
        full_name: user.name,
        avatar_url: user.picture,
        updated_at: new Date().toISOString(),
    })

    if (error) {
        console.error('Error saving user to Supabase:', error)
    }
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        return null
    }
    return data
}
