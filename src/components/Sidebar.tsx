import React from 'react'
import type { FolderId, User } from '../types'
import { Inbox, MessageSquare, Trash2, Pencil, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../design-system/Button'

interface SidebarProps {
    currentFolder: FolderId
    onFolderChange: (folder: FolderId) => void
    user: User | null
    onOpenSettings: () => void
    unreadCounts: Record<FolderId, number>
    onCompose: () => void
    onSearch: () => void
}

export function Sidebar({
    currentFolder,
    onFolderChange,
    user,
    onOpenSettings,
    onCompose,
    onSearch,
    unreadCounts,
}: SidebarProps) {
    const folders: {
        id: FolderId
        icon: React.ElementType
        label: string
        unreadCount?: number
    }[] = [
        {
            id: 'inbox',
            icon: Inbox,
            label: 'Inbox',
        },
        {
            id: 'conversations',
            icon: MessageSquare,
            label: 'Conversations',
        },
        {
            id: 'trash',
            icon: Trash2,
            label: 'Trash',
        },
    ]

    return (
        <div className="flex h-screen w-auto flex-col items-center border-r border-[#E9E9E7] bg-white text-[#37352F] transition-colors duration-200 dark:border-[#2F2F2F] dark:bg-[#191919] dark:text-[#D4D4D4]">
            <div className="flex w-full flex-col items-center border-b border-[#E9E9E7] dark:border-[#2F2F2F]">
                <Button
                    variant="primary"
                    onClick={onCompose}
                    className="group relative flex size-14 items-center justify-center !rounded-none"
                    title="New Message"
                >
                    <Pencil className="size-6" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={onSearch}
                    className="group relative flex size-14 items-center justify-center !rounded-none text-[#787774] transition-all hover:bg-[#EFEFED] dark:text-[#9B9A97] dark:hover:bg-[#2F2F2F]"
                    title="Search"
                >
                    <Search className="size-6" />
                </Button>
                {folders.map((folder) => (
                    <Button
                        key={folder.id}
                        variant="ghost"
                        onClick={() => onFolderChange(folder.id)}
                        className={clsx(
                            'group relative flex size-14 items-center justify-center !rounded-none transition-all hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F]',
                            currentFolder === folder.id
                                ? 'text-black dark:text-white'
                                : 'text-[#787774] dark:text-[#9B9A97]'
                        )}
                    >
                        <div
                            className={clsx(
                                'absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r bg-[#37352F] transition-all duration-300 ease-in-out dark:bg-[#D4D4D4]',
                                currentFolder === folder.id ? 'h-10' : 'h-0'
                            )}
                        />
                        {unreadCounts[folder.id] > 0 &&
                            currentFolder !== folder.id && (
                                <div className="absolute top-1/2 left-0 h-2 w-2 -translate-1/2 rounded-full bg-[#37352F] dark:bg-[#D4D4D4]" />
                            )}
                        <folder.icon className="size-6" />
                    </Button>
                ))}
            </div>

            <div className="mt-auto flex w-full flex-col items-center border-t border-[#E9E9E7] dark:border-[#2F2F2F]">
                <button
                    className="flex size-14 items-center justify-center !rounded-none hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F]"
                    onClick={() => user && onOpenSettings()}
                >
                    {user && (
                        <>
                            {user.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                    {user.name[0]}
                                </div>
                            )}
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
