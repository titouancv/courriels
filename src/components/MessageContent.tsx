import { useState, useEffect } from 'react'
import type { Attachment } from '../types'

interface MessageContentProps {
    content: string
    attachments: Attachment[]
    messageId: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
}

export function MessageContent({
    content,
    attachments,
    messageId,
    onFetchAttachment,
}: MessageContentProps) {
    const [processedContent, setProcessedContent] = useState(content)

    useEffect(() => {
        const processContent = async () => {
            if (!content.includes('cid:')) {
                setProcessedContent(content)
                return
            }

            const parser = new DOMParser()
            const doc = parser.parseFromString(content, 'text/html')
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
                setProcessedContent(content)
            }
        }

        processContent()
    }, [content, attachments, messageId, onFetchAttachment])

    return (
        <div className="">
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        </div>
    )
}
