import type { Attachment, Email, User } from '../types'

export function decodeEmailBody(data: string) {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMessageBody(payload: any): string {
    if (payload.mimeType === 'text/html' && payload.body?.data) {
        return decodeEmailBody(payload.body.data)
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            const body = getMessageBody(part)
            if (body && part.mimeType === 'text/html') return body
        }
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return decodeEmailBody(part.body.data)
            }
        }
    }
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
        return decodeEmailBody(payload.body.data)
    }
    return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAttachments(payload: any): Attachment[] {
    let attachments: Attachment[] = []

    const headers = payload.headers || []
    const contentId = headers
        .find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (h: any) => h.name === 'Content-ID' || h.name === 'X-Attachment-Id'
        )
        ?.value?.replace(/[<>]/g, '')

    if (payload.filename && payload.body?.attachmentId) {
        attachments.push({
            id: payload.body.attachmentId,
            filename: payload.filename,
            mimeType: payload.mimeType,
            size: payload.body.size,
            attachmentId: payload.body.attachmentId,
            contentId,
        })
    }

    if (payload.parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload.parts.forEach((part: any) => {
            attachments = [...attachments, ...getAttachments(part)]
        })
    }

    return attachments
}

export function cleanEmailContent(html: string) {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // Remove Gmail extra quotes
        const gmailQuotes = doc.querySelectorAll('.gmail_quote')
        gmailQuotes.forEach((quote) => quote.remove())

        // Remove blockquotes which often contain the history
        const blockquotes = doc.querySelectorAll('blockquote')
        blockquotes.forEach((quote) => quote.remove())

        // Remove ProtonMail quotes
        const protonQuotes = doc.querySelectorAll('.protonmail_quote')
        protonQuotes.forEach((quote) => quote.remove())

        return doc.body.innerHTML
    } catch (e) {
        console.error('Error cleaning email content:', e)
        return html
    }
}

export async function fetchUserInfo(accessToken: string): Promise<User> {
    const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    )

    if (!userResponse.ok) {
        throw new Error('Failed to fetch user info')
    }

    const userData = await userResponse.json()
    return {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
    }
}

export async function fetchThreadsList(
    accessToken: string,
    query: string,
    pageToken?: string
) {
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=50&q=${encodeURIComponent(query)}`
    if (pageToken) {
        url += `&pageToken=${pageToken}`
    }

    const listResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!listResponse.ok) throw new Error('Failed to fetch threads list')
    return await listResponse.json()
}

export async function fetchThreadDetails(
    accessToken: string,
    threadId: string
): Promise<Email> {
    const threadResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const threadData = await threadResponse.json()

    // Process messages in the thread
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = threadData.messages.map((msgData: any) => {
        const headers = msgData.payload.headers
        const getHeader = (name: string) =>
            headers.find(
                (h: { name: string; value: string }) => h.name === name
            )?.value || ''

        const from = getHeader('From')
        const messageIdHeader =
            getHeader('Message-ID') || getHeader('Message-Id')
        const references = getHeader('References')
        const date = new Date(
            getHeader('Date') || parseInt(msgData.internalDate)
        )

        // Simple sender parsing
        const senderMatch = from.match(/(.*) <(.*)>/)
        const senderName = senderMatch
            ? senderMatch[1].replace(/"/g, '').trim()
            : from.split('@')[0]
        const senderEmail = senderMatch ? senderMatch[2] : from

        const content = getMessageBody(msgData.payload)
        const attachments = getAttachments(msgData.payload)

        const rawContent = content || msgData.snippet
        let cleanedContent = cleanEmailContent(rawContent).trim()

        if (!cleanedContent) {
            cleanedContent = rawContent
        }

        return {
            id: msgData.id,
            sender: {
                name: senderName,
                email: senderEmail,
            },
            content: cleanedContent,
            originalContent: rawContent,
            date: date,
            attachments,
            messageIdHeader,
            references,
        }
    })

    // Use the last message for thread-level info
    const lastMsg = threadData.messages[threadData.messages.length - 1]

    // Use the first message for the subject to keep the original conversation title
    const firstMsg = threadData.messages[0]
    const firstHeaders = firstMsg.payload.headers
    const getFirstHeader = (name: string) =>
        firstHeaders.find(
            (h: { name: string; value: string }) => h.name === name
        )?.value || ''
    const subject = getFirstHeader('Subject')

    const labelIds = lastMsg.labelIds || []

    let folder: 'inbox' | 'sent' | 'drafts' | 'trash' = 'inbox'
    if (labelIds.includes('TRASH')) folder = 'trash'
    else if (labelIds.includes('SENT') && !labelIds.includes('INBOX'))
        folder = 'sent'
    else if (labelIds.includes('DRAFT')) folder = 'drafts'

    return {
        id: threadData.id,
        threadId: threadData.id,
        sender: messages[messages.length - 1].sender, // Use sender of last message
        subject: subject || '(No Subject)',
        preview: lastMsg.snippet,
        messages: messages,
        date: messages[messages.length - 1].date,
        read: !labelIds.includes('UNREAD'),
        labels: labelIds.filter(
            (l: string) =>
                ![
                    'INBOX',
                    'UNREAD',
                    'IMPORTANT',
                    'CATEGORY_PERSONAL',
                    'CATEGORY_UPDATES',
                    'CATEGORY_FORUMS',
                    'CATEGORY_PROMOTIONS',
                ].includes(l)
        ),
        folder: folder,
    } as Email
}

export async function fetchAttachmentData(
    accessToken: string,
    messageId: string,
    attachmentId: string
): Promise<string | null> {
    try {
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )
        const data = await response.json()
        return data.data.replace(/-/g, '+').replace(/_/g, '/')
    } catch (error) {
        console.error('Failed to fetch attachment:', error)
        return null
    }
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const result = reader.result as string
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = (error) => reject(error)
    })
}

export async function sendEmailMessage(
    accessToken: string,
    to: string,
    subject: string,
    body: string,
    threadId?: string,
    inReplyTo?: string,
    references?: string,
    attachments: File[] = []
) {
    const boundary = `boundary_${Date.now().toString(16)}`
    const messageParts = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ]

    if (inReplyTo) {
        messageParts.splice(3, 0, `In-Reply-To: ${inReplyTo}`)
    }
    if (references) {
        messageParts.splice(3, 0, `References: ${references}`)
    }

    // Body part
    const bodyParts = [
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
    ]

    // Attachment parts
    const attachmentParts = await Promise.all(
        attachments.map(async (file) => {
            const base64Content = await fileToBase64(file)
            return [
                `--${boundary}`,
                `Content-Type: ${file.type}; name="${file.name}"`,
                'Content-Transfer-Encoding: base64',
                `Content-Disposition: attachment; filename="${file.name}"`,
                '',
                base64Content,
            ].join('\r\n')
        })
    )

    const fullMessage = [
        ...messageParts,
        '',
        ...bodyParts,
        ...attachmentParts,
        `--${boundary}--`,
    ].join('\r\n')

    const encodedMessage = btoa(unescape(encodeURIComponent(fullMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

    const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                raw: encodedMessage,
                threadId: threadId,
            }),
        }
    )

    if (!response.ok) {
        throw new Error('Failed to send email')
    }
}
