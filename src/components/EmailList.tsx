import type { Email, User, FolderId } from '../types'
import { clsx } from 'clsx'
import { RotateCw } from 'lucide-react'
import { Button } from '../design-system/Button'
import { formatEmailDate } from '../utils/date'

interface EmailListProps {
    emails: Email[]
    selectedEmailId: string | null
    onSelectEmail: (id: string) => void
    onRefresh?: () => void
    isRefreshing?: boolean
    onLoadMore?: () => void
    hasMore?: boolean
    currentUser: User | null
    searchQuery?: string
    currentFolder: FolderId
}

export function EmailList({
    emails,
    selectedEmailId,
    onSelectEmail,
    onRefresh,
    isRefreshing,
    onLoadMore,
    hasMore,
    currentUser,
    searchQuery,
    currentFolder,
}: EmailListProps) {
    const getTitle = () => {
        if (searchQuery) return 'Search'
        switch (currentFolder) {
            case 'notifications':
                return 'Notifications'
            case 'conversations':
                return 'Conversations'
            case 'trash':
                return 'Trash'
            default:
                return 'Inbox'
        }
    }

    return (
        <div
            className={clsx(
                'flex h-full flex-col overflow-y-auto border-r border-[#E9E9E7] bg-white transition-all duration-300 ease-in-out dark:border-[#2F2F2F] dark:bg-[#191919]',
                selectedEmailId ? 'w-96' : 'flex-1'
            )}
        >
            <div className="sticky top-0 z-10 space-y-4 border-b border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
                            {getTitle()}
                        </h2>
                        <p className="mt-1 text-xs text-[#787774] dark:text-[#9B9A97]">
                            {emails.length} messages
                        </p>
                    </div>
                    {onRefresh && (
                        <Button
                            variant="icon"
                            size="icon"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className={clsx(
                                isRefreshing && 'animate-spin',
                                'dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]'
                            )}
                            icon={RotateCw}
                        />
                    )}
                </div>
            </div>
            <div className="divide-y divide-[#E9E9E7] dark:divide-[#2F2F2F]">
                {emails.map((email) => {
                    const otherSenders = email.messages.filter(
                        (m) => m.sender.email !== currentUser?.email
                    )
                    const uniqueNames = Array.from(
                        new Set(otherSenders.map((m) => m.sender.name))
                    )
                    const displayName =
                        uniqueNames.length > 0
                            ? uniqueNames.join(', ')
                            : email.sender.name

                    let avatarName = email.sender.name
                    let avatarUrl = undefined

                    if (otherSenders.length > 0) {
                        const lastOther = otherSenders[otherSenders.length - 1]
                        avatarName = lastOther.sender.name
                    } else {
                        if (
                            currentUser &&
                            currentUser.email === email.sender.email
                        ) {
                            avatarUrl = currentUser.picture
                        }
                    }

                    return (
                        <div
                            key={email.id}
                            onClick={() => onSelectEmail(email.id)}
                            className={clsx(
                                'flex cursor-pointer gap-3 p-4 transition-colors hover:bg-[#F7F7F5] dark:hover:bg-[#202020]',
                                selectedEmailId === email.id
                                    ? 'bg-[#F7F7F5] dark:bg-[#202020]'
                                    : 'bg-white dark:bg-[#191919]',
                                !email.read &&
                                    'bg-[#00712D]/5 dark:bg-[#00712D]/20'
                            )}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={avatarName}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00712D]/60 to-[#00712D] text-xs font-medium text-white">
                                        {avatarName[0]}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-baseline justify-between">
                                    <span
                                        className={clsx(
                                            'truncate pr-2 text-sm',
                                            !email.read
                                                ? 'font-semibold text-[#37352F] dark:text-white'
                                                : 'text-[#37352F] dark:text-[#D4D4D4]'
                                        )}
                                    >
                                        {displayName}
                                    </span>
                                    <span className="text-xs whitespace-nowrap text-[#9B9A97]">
                                        {formatEmailDate(email.date)}
                                    </span>
                                </div>
                                <div
                                    className={clsx(
                                        'mb-1 truncate text-xs',
                                        !email.read
                                            ? 'font-medium text-[#37352F] dark:text-white'
                                            : 'text-[#37352F] dark:text-[#D4D4D4]'
                                    )}
                                >
                                    {email.subject}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {hasMore && onLoadMore && (
                <div className="border-t border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
                    <Button
                        variant="ghost"
                        onClick={onLoadMore}
                        disabled={isRefreshing}
                        className="w-full dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]"
                    >
                        {isRefreshing ? 'Loading...' : 'Load more'}
                    </Button>
                </div>
            )}
        </div>
    )
}
