import React from 'react'
import type { FolderId, User } from '../types'
import { Bell, MessageSquare, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../design-system/Button'

interface SidebarProps {
    currentFolder: FolderId
    onFolderChange: (folder: FolderId) => void
    user: User | null
    onOpenSettings: () => void
    unreadCounts: Record<FolderId, number>
}

export function Sidebar({
    currentFolder,
    onFolderChange,
    user,
    onOpenSettings,
    unreadCounts,
}: SidebarProps) {
    const folders: {
        id: FolderId
        icon: React.ElementType
        label: string
        unreadCount?: number
    }[] = [
        {
            id: 'conversations',
            icon: MessageSquare,
            label: 'Conversations',
        },
        {
            id: 'notifications',
            icon: Bell,
            label: 'Notifications',
        },
        {
            id: 'trash',
            icon: Trash2,
            label: 'Trash',
        },
    ]

    // const isUnreadCount = (folderId: FolderId) => {
    //     return (unreadCounts[folderId] ?? 0) > 0
    // }

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
                            {/* {isUnreadCount(folder.id) && (
                                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                                    {unreadCounts[folder.id]}
                                </span>
                            )} */}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="mt-auto border-t border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 px-2 py-1 hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F]"
                    onClick={() => user && onOpenSettings()}
                >
                    {user && (
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
                                {user.name}
                            </span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
