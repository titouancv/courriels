import { useState, useEffect } from 'react'
import type { Attachment } from '../types'

interface MessageContentProps {
    content: string
    originalContent?: string
    attachments: Attachment[]
    messageId: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
}

export function MessageContent({
    content,
    originalContent,
    attachments,
    messageId,
    onFetchAttachment,
}: MessageContentProps) {
    const activeContent = originalContent || content
    const [processedContent, setProcessedContent] = useState(activeContent)

    useEffect(() => {
        const processContent = async () => {
            if (!activeContent.includes('cid:')) {
                setProcessedContent(activeContent)
                return
            }

            const parser = new DOMParser()
            const doc = parser.parseFromString(activeContent, 'text/html')
            const images = doc.querySelectorAll('img[src^="cid:"]')

            let hasChanges = false
            for (const img of images) {
                const cid = img.getAttribute('src')?.replace('cid:', '')
                const attachment = attachments.find((a) => a.contentId === cid)
                if (attachment && attachment.attachmentId) {
                    const data = await onFetchAttachment(
                        messageId,
                        attachment.attachmentId
                    )
                    if (data) {
                        img.setAttribute(
                            'src',
                            `data:${attachment.mimeType};base64,${data}`
                        )
                        hasChanges = true
                    }
                }
            }

            if (hasChanges) {
                setProcessedContent(doc.body.innerHTML)
            } else {
                setProcessedContent(activeContent)
            }
        }

        processContent()
    }, [activeContent, attachments, messageId, onFetchAttachment])

    return (
        <div className="">
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        </div>
    )
}
