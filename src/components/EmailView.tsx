import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Email, Attachment } from '../types'
import { X, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../design-system/Button'
import { formatEmailDate } from '../utils/date'
import { MessageContent } from './MessageContent'
import { AttachmentItem } from './AttachmentItem'
import { ReplyBox } from './ReplyBox'
import { ImageStack, Lightbox } from './ImageGallery'

import {
    FileCode,
    MoreHorizontal,
    Forward,
    Trash2,
    MailOpen,
    Info,
} from 'lucide-react'

interface EmailViewProps {
    email: Email | null
    onSendReply: (body: string, attachments: File[]) => Promise<void>
    onForward: (subject: string, body: string) => void
    onDelete?: (emailId: string, threadId: string) => void
    onMarkAsRead?: (emailId: string, threadId: string) => void
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
    onForward,
    onDelete,
    onMarkAsRead,
    currentUserEmail,
    onFetchAttachment,
    onClose,
}: EmailViewProps) {
    const [isSending, setIsSending] = useState(false)
    const [showOriginal, setShowOriginal] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [lightboxState, setLightboxState] = useState<{
        images: Attachment[]
        initialIndex: number
        messageId: string
    } | null>(null)
    const [activeMenuMessageId, setActiveMenuMessageId] = useState<
        string | null
    >(null)
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

    const handleSend = async (body: string, attachments: File[]) => {
        setIsSending(true)
        try {
            await onSendReply(body, attachments)
        } finally {
            setIsSending(false)
        }
    }

    const uniqueNames = Array.from(
        new Set(
            email.messages
                .filter((m) => m.sender.email !== currentUserEmail)
                .map((m) => m.sender.email)
        )
    )

    const displayNames =
        uniqueNames.length > 0 ? uniqueNames.join(', ') : email.sender.email

    return (
        <div className="flex h-full flex-1 flex-col overflow-y-auto border-l border-[#E9E9E7] bg-white dark:border-[#2F2F2F] dark:bg-[#191919]">
            <div className="sticky top-0 z-10 border-b border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <div className="flex items-start justify-between gap-4">
                    <Button
                        variant="icon"
                        size="icon"
                        onClick={onClose}
                        className="md:hidden"
                        icon={ArrowLeft}
                    />
                    <div className="min-w-0 flex-1">
                        <h1
                            className="truncate text-xl font-semibold text-[#37352F] dark:text-[#D4D4D4]"
                            title={email.subject}
                        >
                            {email.subject}
                        </h1>
                        <div className="mt-1 truncate text-sm text-[#787774] dark:text-[#9B9A97]">
                            {displayNames}
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2 text-[#787774] dark:text-[#9B9A97]">
                        {onMarkAsRead && !email.read && (
                            <Button
                                variant="icon"
                                size="icon"
                                onClick={() =>
                                    onMarkAsRead(email.id, email.threadId)
                                }
                                title="Mark as read"
                                icon={MailOpen}
                            />
                        )}
                        {onDelete && (
                            <Button
                                variant="icon"
                                size="icon"
                                onClick={() => {
                                    onDelete(email.id, email.threadId)
                                    onClose()
                                }}
                                title="Delete"
                                icon={Trash2}
                            />
                        )}
                        <Button
                            variant="icon"
                            size="icon"
                            onClick={() => setShowDetails(true)}
                            title="View details"
                            icon={Info}
                        />
                        <Button
                            variant="icon"
                            size="icon"
                            onClick={onClose}
                            title="Close"
                            icon={X}
                            className="invisible md:visible"
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
                                        {isMe ? 'Me' : message.sender.name}
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
                                    'flex items-center gap-2',
                                    isMe && 'flex-row-reverse'
                                )}
                            >
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
                                        originalContent={
                                            showOriginal
                                                ? message.originalContent
                                                : undefined
                                        }
                                        attachments={message.attachments}
                                        messageId={message.id}
                                        onFetchAttachment={onFetchAttachment}
                                    />

                                    {message.attachments &&
                                        message.attachments.length > 0 && (
                                            <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
                                                {(() => {
                                                    const images =
                                                        message.attachments.filter(
                                                            (a) =>
                                                                !a.contentId &&
                                                                a.mimeType.startsWith(
                                                                    'image/'
                                                                )
                                                        )
                                                    const others =
                                                        message.attachments.filter(
                                                            (a) =>
                                                                !a.contentId &&
                                                                !a.mimeType.startsWith(
                                                                    'image/'
                                                                )
                                                        )

                                                    return (
                                                        <>
                                                            {images.length >
                                                                0 && (
                                                                <div className="mb-4">
                                                                    <ImageStack
                                                                        images={
                                                                            images
                                                                        }
                                                                        messageId={
                                                                            message.id
                                                                        }
                                                                        onFetchAttachment={
                                                                            onFetchAttachment
                                                                        }
                                                                        onOpenLightbox={(
                                                                            index
                                                                        ) =>
                                                                            setLightboxState(
                                                                                {
                                                                                    images,
                                                                                    initialIndex:
                                                                                        index,
                                                                                    messageId:
                                                                                        message.id,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                            {others.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-4">
                                                                    {others.map(
                                                                        (
                                                                            attachment
                                                                        ) => (
                                                                            <AttachmentItem
                                                                                key={
                                                                                    attachment.id
                                                                                }
                                                                                attachment={
                                                                                    attachment
                                                                                }
                                                                                messageId={
                                                                                    message.id
                                                                                }
                                                                                onFetchAttachment={
                                                                                    onFetchAttachment
                                                                                }
                                                                            />
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                </div>

                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setActiveMenuMessageId(
                                                activeMenuMessageId ===
                                                    message.id
                                                    ? null
                                                    : message.id
                                            )
                                        }
                                        className="h-8 w-8 text-[#9B9A97] hover:bg-[#EFEFED] hover:text-[#37352F] dark:hover:bg-[#2F2F2F] dark:hover:text-[#D4D4D4]"
                                        icon={MoreHorizontal}
                                    />
                                    {activeMenuMessageId === message.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() =>
                                                    setActiveMenuMessageId(null)
                                                }
                                            />
                                            <div
                                                className={clsx(
                                                    'absolute z-20 mt-1 w-48 rounded-md border border-[#E9E9E7] bg-white py-1 shadow-lg dark:border-[#2F2F2F] dark:bg-[#191919]',
                                                    isMe ? 'right-0' : 'left-0'
                                                )}
                                            >
                                                <button
                                                    onClick={() => {
                                                        onForward(
                                                            `Fwd: ${email.subject}`,
                                                            `\n\n---------- Forwarded message ---------\nFrom: ${message.sender.name} <${message.sender.email}>\nDate: ${formatEmailDate(message.date, { includeTime: true })}\nSubject: ${email.subject}\nTo: ${currentUserEmail}\n\n${message.content}`
                                                        )
                                                        setActiveMenuMessageId(
                                                            null
                                                        )
                                                    }}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#37352F] hover:bg-[#F7F7F5] dark:text-[#D4D4D4] dark:hover:bg-[#202020]"
                                                >
                                                    <Forward className="h-4 w-4" />
                                                    Forward
                                                </button>
                                                {message.originalContent && (
                                                    <button
                                                        onClick={() => {
                                                            setShowOriginal(
                                                                !showOriginal
                                                            )
                                                            setActiveMenuMessageId(
                                                                null
                                                            )
                                                        }}
                                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#37352F] hover:bg-[#F7F7F5] dark:text-[#D4D4D4] dark:hover:bg-[#202020]"
                                                    >
                                                        <FileCode className="h-4 w-4" />
                                                        {showOriginal
                                                            ? 'Show cleaned view'
                                                            : 'Show original format'}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {showDetails &&
                createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl dark:bg-[#191919]">
                            <div className="flex items-center justify-between border-b border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
                                <h2 className="text-lg font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                                    Message Details
                                </h2>
                                <Button
                                    variant="icon"
                                    size="icon"
                                    onClick={() => setShowDetails(false)}
                                    icon={X}
                                />
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="rounded-lg bg-[#F7F7F5] p-4 font-mono text-xs break-words whitespace-pre-wrap text-[#37352F] dark:bg-[#202020] dark:text-[#D4D4D4]">
                                    {JSON.stringify(email, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {lightboxState && (
                <Lightbox
                    images={lightboxState.images}
                    initialIndex={lightboxState.initialIndex}
                    messageId={lightboxState.messageId}
                    onFetchAttachment={onFetchAttachment}
                    onClose={() => setLightboxState(null)}
                />
            )}

            <ReplyBox
                onSend={handleSend}
                isSending={isSending}
                thread={JSON.stringify(email, null, 2)}
            />
        </div>
    )
}
