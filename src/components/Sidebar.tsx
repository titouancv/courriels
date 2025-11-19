import React from 'react'
import type { FolderId, User } from '../types'
import {
    Bell,
    MessageSquare,
    Trash2,
    LogIn,
    LogOut,
    Moon,
    Sun,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
    useGoogleLogin,
    googleLogout,
    type TokenResponse,
} from '@react-oauth/google'
import { Button } from '../design-system/Button'

interface SidebarProps {
    currentFolder: FolderId
    onFolderChange: (folder: FolderId) => void
    unreadCounts: Record<FolderId, number>
    user: User | null
    onLoginSuccess: (tokenResponse: TokenResponse) => void
    onLogout: () => void
    darkMode: boolean
    toggleDarkMode: () => void
}

export function Sidebar({
    currentFolder,
    onFolderChange,
    unreadCounts,
    user,
    onLoginSuccess,
    onLogout,
    darkMode,
    toggleDarkMode,
}: SidebarProps) {
    const login = useGoogleLogin({
        onSuccess: onLoginSuccess,
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    })

    const handleLogout = (e: React.MouseEvent) => {
        e.stopPropagation()
        googleLogout()
        onLogout()
    }

    const folders: { id: FolderId; icon: React.ElementType; label: string }[] =
        [
            {
                id: 'conversations',
                icon: MessageSquare,
                label: 'Conversations',
            },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'trash', icon: Trash2, label: 'Trash' },
        ]

    return (
        <div className="flex h-screen w-64 flex-col border-r border-[#E9E9E7] bg-[#F7F7F5] text-[#37352F] transition-colors duration-200 dark:border-[#2F2F2F] dark:bg-[#202020] dark:text-[#D4D4D4]">
            <div className="p-4">
                <div className="mb-6 text-lg font-semibold">courriels</div>

                <div className="space-y-0.5">
                    {folders.map((folder) => (
                        <Button
                            key={folder.id}
                            variant="ghost"
                            onClick={() => onFolderChange(folder.id)}
                            className={clsx(
                                'w-full justify-start dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]',
                                currentFolder === folder.id &&
                                    'bg-[#EFEFED] text-[#37352F] dark:bg-[#2F2F2F] dark:text-white'
                            )}
                            icon={folder.icon}
                        >
                            <span>{folder.label}</span>
                            {unreadCounts[folder.id] > 0 && (
                                <span className="ml-auto text-xs text-[#787774] dark:text-[#9B9A97]">
                                    {unreadCounts[folder.id]}
                                </span>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="mt-auto border-t border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
                <Button
                    onClick={toggleDarkMode}
                    variant="ghost"
                    className="w-full justify-start dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]"
                    icon={darkMode ? Sun : Moon}
                >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <div
                    className="mb-4 flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F]"
                    onClick={() => !user && login()}
                >
                    {user ? (
                        <>
                            {user.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="h-5 w-5 rounded-full"
                                />
                            ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">
                                    {user.name[0]}
                                </div>
                            )}
                            <span className="truncate text-sm font-medium">
                                {user.email}
                            </span>
                            <Button
                                variant="icon"
                                size="icon"
                                onClick={handleLogout}
                                className="ml-auto hover:text-red-500"
                                title="Logout"
                                icon={LogOut}
                            />
                        </>
                    ) : (
                        <>
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-400 text-white">
                                <LogIn className="h-3 w-3" />
                            </div>
                            <span className="truncate text-sm font-medium">
                                Connect Gmail
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
