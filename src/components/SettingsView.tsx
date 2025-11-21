import { useState } from 'react'
import { Button } from '../design-system/Button'
import { supabase } from '../lib/supabase'
import type { User } from '../types'
import { LogOut, Moon, Sun, X } from 'lucide-react'

interface SettingsViewProps {
    user: User
    onUpdateUser: (user: User) => void
    onLogout: () => void
    darkMode: boolean
    toggleDarkMode: () => void
    onClose: () => void
}

export function SettingsView({
    user,
    onUpdateUser,
    onLogout,
    darkMode,
    toggleDarkMode,
    onClose,
}: SettingsViewProps) {
    const [name, setName] = useState(user.name)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSave = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            if (!session?.user) return

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: name,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', session.user.id)

            if (error) throw error

            onUpdateUser({ ...user, name })
            setMessage('Settings saved successfully')

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            setMessage('Error saving settings')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-white p-8 dark:bg-[#191919] dark:text-[#D4D4D4]">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Settings</h2>
                    <Button variant="icon" onClick={onClose} icon={X} />
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email
                        </label>
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            className="w-full rounded-lg border border-[#E9E9E7] bg-[#F7F7F5] px-3 py-2 text-[#787774] dark:border-[#2F2F2F] dark:bg-[#2F2F2F] dark:text-[#9B9A97]"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-[#E9E9E7] bg-white px-3 py-2 dark:border-[#2F2F2F] dark:bg-[#191919]"
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        {message && (
                            <span
                                className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}
                            >
                                {message}
                            </span>
                        )}
                    </div>

                    <div className="border-t border-[#E9E9E7] pt-6 dark:border-[#2F2F2F]">
                        <h3 className="mb-4 text-lg font-medium">Appearance</h3>
                        <Button
                            onClick={toggleDarkMode}
                            variant="secondary"
                            className="w-full justify-start gap-2"
                            icon={darkMode ? Sun : Moon}
                        >
                            {darkMode
                                ? 'Switch to Light Mode'
                                : 'Switch to Dark Mode'}
                        </Button>
                    </div>

                    <div className="border-t border-[#E9E9E7] pt-6 dark:border-[#2F2F2F]">
                        <h3 className="mb-4 text-lg font-medium text-red-600 dark:text-red-400">
                            Danger Zone
                        </h3>
                        <Button
                            variant="secondary"
                            onClick={onLogout}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                            icon={LogOut}
                        >
                            Log out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
