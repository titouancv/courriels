import { useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import type { Email, User, FolderId } from '../types'
import { clsx } from 'clsx'
import { RotateCw, Filter, FilterX } from 'lucide-react'
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
    className?: string
}

function EmailSkeleton() {
    return (
        <div className="flex gap-3 border-b border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
            <div className="flex -space-x-2">
                <Skeleton circle width={32} height={32} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between">
                    <Skeleton width={120} />
                    <Skeleton width={60} />
                </div>
                <div className="mb-1">
                    <Skeleton width="80%" />
                </div>
            </div>
        </div>
    )
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
    className,
}: EmailListProps) {
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const filteredEmails = showUnreadOnly
        ? emails.filter((e) => !e.read)
        : emails

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

    const getDescription = () => {
        if (searchQuery) return `Results for "${searchQuery}"`
        switch (currentFolder) {
            case 'notifications':
                return 'Updates, alerts, and newsletters'
            case 'conversations':
                return 'Email sent and threads'
            case 'trash':
                return 'Deleted items'
            default:
                return 'All your messages'
        }
    }

    return (
        <div
            className={clsx(
                'flex h-full flex-col border-r border-[#E9E9E7] bg-white transition-all duration-300 ease-in-out dark:border-[#2F2F2F] dark:bg-[#191919]',
                selectedEmailId ? 'w-96' : 'flex-1',
                className
            )}
        >
            <div className="z-40 space-y-4 border-b border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#37352F] dark:text-[#D4D4D4]">
                            {getTitle()}
                        </h2>
                        <div className="flex flex-row items-center space-x-2">
                            <span className="text-sm text-[#787774] dark:text-[#9B9A97]">
                                {getDescription()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="icon"
                            size="icon"
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                            className={clsx(
                                showUnreadOnly
                                    ? 'bg-[#E9E9E7] text-[#37352F] dark:bg-[#2F2F2F] dark:text-white'
                                    : 'text-[#787774] hover:bg-[#F7F7F5] dark:text-[#9B9A97] dark:hover:bg-[#2F2F2F]'
                            )}
                            icon={showUnreadOnly ? FilterX : Filter}
                            title={
                                showUnreadOnly ? 'Show all' : 'Filter unread'
                            }
                        />
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
            </div>

            <div className="flex-1">
                {emails.length === 0 && isRefreshing ? (
                    <div className="divide-y divide-[#E9E9E7] dark:divide-[#2F2F2F]">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <EmailSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={filteredEmails}
                        endReached={() => hasMore && onLoadMore?.()}
                        components={{
                            Footer: () =>
                                isRefreshing && hasMore ? (
                                    <div className="p-4">
                                        <EmailSkeleton />
                                    </div>
                                ) : null,
                        }}
                        itemContent={(_index, email) => {
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

                            const uniqueParticipants = Array.from(
                                new Map(
                                    otherSenders.map((m) => [
                                        m.sender.email,
                                        m.sender,
                                    ])
                                ).values()
                            )

                            const sendersToShow =
                                uniqueParticipants.length > 0
                                    ? uniqueParticipants
                                    : [email.sender]

                            const visibleSenders = sendersToShow.slice(0, 3)

                            return (
                                <div
                                    onClick={() => onSelectEmail(email.id)}
                                    className={clsx(
                                        'relative flex cursor-pointer gap-3 border-b border-[#E9E9E7] p-4 transition-colors hover:bg-[#F7F7F5] dark:border-[#2F2F2F] dark:hover:bg-[#202020]',
                                        selectedEmailId === email.id
                                            ? 'bg-[#F7F7F5] dark:bg-[#202020]'
                                            : 'bg-white dark:bg-[#191919]',
                                        !email.read &&
                                            'bg-[#F0FDF4] dark:bg-[#00712D]/10'
                                    )}
                                >
                                    {!email.read && (
                                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#00712D]" />
                                    )}
                                    <div className="mt-1 flex flex-shrink-0 -space-x-2">
                                        {visibleSenders.map((sender, i) => (
                                            <div
                                                key={sender.email}
                                                className="relative z-10 hover:z-20"
                                                style={{ zIndex: 30 - i }}
                                            >
                                                {(() => {
                                                    const avatarUrl =
                                                        sender.email ===
                                                        currentUser?.email
                                                            ? currentUser?.picture
                                                            : sender.avatar
                                                    return avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt={sender.name}
                                                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-[#191919]"
                                                        />
                                                    ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00712D]/60 to-[#00712D] text-xs font-medium text-white ring-2 ring-white dark:ring-[#191919]">
                                                            {sender.name[0]}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        ))}
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
                        }}
                    />
                )}
            </div>
        </div>
    )
}
