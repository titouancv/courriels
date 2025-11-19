import { useState, useEffect } from 'react'
import type { Attachment } from '../types'
import { Paperclip, Download } from 'lucide-react'
import { Button } from '../design-system/Button'

interface AttachmentItemProps {
    attachment: Attachment
    messageId: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
}

export function AttachmentItem({
    attachment,
    messageId,
    onFetchAttachment,
}: AttachmentItemProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const isImage = attachment.mimeType.startsWith('image/')

    useEffect(() => {
        let mounted = true
        if (isImage && attachment.attachmentId) {
            onFetchAttachment(messageId, attachment.attachmentId).then(
                (data) => {
                    if (mounted && data) {
                        setPreviewUrl(
                            `data:${attachment.mimeType};base64,${data}`
                        )
                    }
                }
            )
        }
        return () => {
            mounted = false
        }
    }, [isImage, attachment, messageId, onFetchAttachment])

    if (isImage && previewUrl) {
        return (
            <div className="group relative mr-4 mb-4 inline-block align-top">
                <img
                    src={previewUrl}
                    alt={attachment.filename}
                    className="max-h-64 rounded-lg border border-[#E9E9E7] bg-[#F7F7F5] object-contain dark:border-[#2F2F2F] dark:bg-[#202020]"
                />
                <div className="absolute top-2 right-2 rounded border border-[#E9E9E7] bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-[#2F2F2F] dark:bg-[#191919]/90">
                    <Button
                        variant="icon"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            const link = document.createElement('a')
                            link.href = previewUrl
                            link.download = attachment.filename
                            link.click()
                        }}
                        title="Download"
                        icon={Download}
                    />
                </div>
                <div className="mt-1 max-w-[200px] truncate text-xs text-[#787774] dark:text-[#9B9A97]">
                    {attachment.filename}
                </div>
            </div>
        )
    }

    return (
        <div className="mb-2 flex items-center justify-between rounded border border-black/5 bg-white/50 p-2 text-sm text-[#37352F] dark:border-white/10 dark:bg-[#191919]/50 dark:text-[#D4D4D4]">
            <div className="flex items-center gap-2 overflow-hidden">
                <Paperclip className="h-4 w-4 flex-shrink-0 text-[#787774] dark:text-[#9B9A97]" />
                <span className="truncate">{attachment.filename}</span>
                <span className="text-xs text-[#9B9A97]">
                    ({Math.round(attachment.size / 1024)}KB)
                </span>
            </div>
            <Button
                variant="icon"
                size="icon"
                onClick={async () => {
                    if (attachment.attachmentId) {
                        const data = await onFetchAttachment(
                            messageId,
                            attachment.attachmentId
                        )
                        if (data) {
                            const link = document.createElement('a')
                            link.href = `data:${attachment.mimeType};base64,${data}`
                            link.download = attachment.filename
                            link.click()
                        }
                    }
                }}
                title="Download"
                icon={Download}
            />
        </div>
    )
}
