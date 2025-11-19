import { useState, useEffect, useRef } from 'react'
import type { Email } from '../types'
import { X, Send } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../design-system/Button'
import { formatEmailDate } from '../utils/date'
import { MessageContent } from './MessageContent'
import { AttachmentItem } from './AttachmentItem'

interface EmailViewProps {
    email: Email | null
    onSendReply: (body: string) => Promise<void>
    currentUserEmail?: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
    onClose: () => void
}

export function EmailView({
    email,
    onSendReply,
    currentUserEmail,
    onFetchAttachment,
    onClose,
}: EmailViewProps) {
    const [replyBody, setReplyBody] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [email?.id, email?.messages.length])

    if (!email) {
        return null
    }

    const handleSend = async () => {
        if (!replyBody.trim()) return
        setIsSending(true)
        try {
            await onSendReply(replyBody)
            setReplyBody('')
        } finally {
            setIsSending(false)
        }
    }

    const uniqueNames = Array.from(
        new Set(email.messages.map((m) => m.sender.name))
    )

    return (
        <div className="flex h-full flex-1 flex-col overflow-y-auto border-l border-[#E9E9E7] bg-white dark:border-[#2F2F2F] dark:bg-[#191919]">
            <div className="sticky top-0 z-10 border-b border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                        <h1
                            className="truncate text-xl font-semibold text-[#37352F] dark:text-[#D4D4D4]"
                            title={email.subject}
                        >
                            {email.subject}
                        </h1>
                        <div className="mt-1 truncate text-sm text-[#787774] dark:text-[#9B9A97]">
                            {uniqueNames.join(', ')}
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2 text-[#787774] dark:text-[#9B9A97]">
                        <Button
                            variant="icon"
                            size="icon"
                            onClick={onClose}
                            title="Close"
                            icon={X}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-4">
                {email.messages.map((message) => {
                    const isMe =
                        currentUserEmail &&
                        message.sender.email === currentUserEmail
                    return (
                        <div
                            key={message.id}
                            className={clsx(
                                'flex max-w-3xl flex-col',
                                isMe
                                    ? 'ml-auto items-end'
                                    : 'mr-auto items-start'
                            )}
                        >
                            <div
                                className={clsx(
                                    'mb-2 flex items-center gap-3',
                                    isMe && 'flex-row-reverse'
                                )}
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00712D]/60 to-[#00712D] text-sm font-medium text-white">
                                    {message.sender.name[0]}
                                </div>
                                <div
                                    className={clsx(
                                        'text-sm',
                                        isMe ? 'text-right' : 'text-left'
                                    )}
                                >
                                    <div className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
                                        {message.sender.name}
                                    </div>
                                    <div className="text-xs text-[#787774] dark:text-[#9B9A97]">
                                        {formatEmailDate(message.date, {
                                            includeTime: true,
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={clsx(
                                    'prose prose-stone dark:prose-invert max-w-2xl rounded-lg p-4',
                                    isMe
                                        ? 'bg-[#00712D]/5 text-[#37352F] dark:bg-[#00712D]/20 dark:text-[#D4D4D4]'
                                        : 'bg-[#F7F7F5] text-[#37352F] dark:bg-[#202020] dark:text-[#D4D4D4]'
                                )}
                            >
                                <MessageContent
                                    content={message.content}
                                    originalContent={message.originalContent}
                                    attachments={message.attachments}
                                    messageId={message.id}
                                    onFetchAttachment={onFetchAttachment}
                                />

                                {message.attachments &&
                                    message.attachments.length > 0 && (
                                        <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
                                            {message.attachments
                                                .filter(
                                                    (a) =>
                                                        !a.contentId ||
                                                        !a.mimeType.startsWith(
                                                            'image/'
                                                        )
                                                )
                                                .map((attachment) => (
                                                    <AttachmentItem
                                                        key={attachment.id}
                                                        attachment={attachment}
                                                        messageId={message.id}
                                                        onFetchAttachment={
                                                            onFetchAttachment
                                                        }
                                                    />
                                                ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-auto border-t border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <div className="flex items-end gap-2">
                    <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[80px] flex-1 resize-none rounded-lg border border-[#E9E9E7] bg-white p-3 text-[#37352F] placeholder-[#9B9A97] focus:ring-2 focus:ring-[#00712D]/20 focus:outline-none dark:border-[#2F2F2F] dark:bg-[#202020] dark:text-[#D4D4D4]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!replyBody.trim() || isSending}
                        variant="primary"
                        size="icon"
                        icon={Send}
                        className="mb-1"
                    />
                </div>
            </div>
        </div>
    )
}
