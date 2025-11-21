import { X } from 'lucide-react'
import { SearchInput } from '../design-system/SearchInput'
import { Button } from '../design-system/Button'
import { useEffect, useRef } from 'react'
import type { Email } from '../types'
import { formatEmailDate } from '../utils/date'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface SearchModalProps {
    isOpen: boolean
    onClose: () => void
    searchQuery: string
    onSearchChange: (query: string) => void
    results: Email[]
    onSelectResult: (emailId: string) => void
    isLoading?: boolean
}

export function SearchModal({
    isOpen,
    onClose,
    searchQuery,
    onSearchChange,
    results,
    onSelectResult,
    isLoading,
}: SearchModalProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            // Focus the input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-4 shadow-xl dark:bg-[#191919]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder="Search emails..."
                            inputRef={inputRef}
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        icon={X}
                    />
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-1 border-b border-[#E9E9E7] p-3 last:border-0 dark:border-[#2F2F2F]"
                            >
                                <div className="flex w-full items-baseline justify-between">
                                    <Skeleton width={120} />
                                    <Skeleton width={60} />
                                </div>
                                <Skeleton width="60%" />
                                <Skeleton width="80%" />
                            </div>
                        ))}
                    </div>
                ) : (
                    results.length > 0 && (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <div className="flex flex-col">
                                {results.map((email) => (
                                    <button
                                        key={email.id}
                                        onClick={() => onSelectResult(email.id)}
                                        className="flex flex-col gap-1 border-b border-[#E9E9E7] p-3 text-left transition-colors last:border-0 hover:bg-[#F7F7F5] dark:border-[#2F2F2F] dark:hover:bg-[#2F2F2F]"
                                    >
                                        <div className="flex w-full items-baseline justify-between">
                                            <span className="truncate font-medium text-[#37352F] dark:text-[#D4D4D4]">
                                                {email.sender.name ||
                                                    email.sender.email}
                                            </span>
                                            <span className="shrink-0 text-xs text-[#787774] dark:text-[#9B9A97]">
                                                {formatEmailDate(email.date)}
                                            </span>
                                        </div>
                                        <span className="truncate text-sm text-[#37352F] dark:text-[#D4D4D4]">
                                            {email.subject || '(No Subject)'}
                                        </span>
                                        <span className="line-clamp-1 text-xs text-[#787774] dark:text-[#9B9A97]">
                                            {email.preview}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
