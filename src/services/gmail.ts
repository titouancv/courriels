import type { Attachment, User } from '../types'

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

        // 1️⃣ Supprimer blockquotes (Gmail, Apple Mail, Outlook…)
        doc.querySelectorAll('blockquote').forEach((el) => el.remove())

        // 2️⃣ Gmail quote
        doc.querySelectorAll('.gmail_quote, .gmail_attr').forEach((el) =>
            el.remove()
        )

        // 3️⃣ ProtonMail
        doc.querySelectorAll('.protonmail_quote').forEach((el) => el.remove())

        // 4️⃣ Toute div avec left-border = reply quote
        doc.querySelectorAll('div').forEach((div) => {
            const style = div.getAttribute('style') || ''
            if (
                style.includes('border-left') ||
                style.includes('border-inline-start')
            ) {
                div.remove()
            }
        })

        // 5️⃣ Détection TEXTUELLE des entêtes de reply
        const replyHeaderRegex =
            /(On\s.+?wrote:)|(Le\s.+?a écrit)|(From:\s.+)|(Sent:\s.+)|(To:\s.+)|(De :\s.+)/i

        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
        const toRemove: HTMLElement[] = []

        while (walker.nextNode()) {
            const el = walker.currentNode as HTMLElement
            if (!el.innerText) continue

            if (replyHeaderRegex.test(el.innerText.trim())) {
                toRemove.push(el)
            }
        }

        toRemove.forEach((el) => el.remove())

        // 6️⃣ Supprimer les séparateurs horizontaux typiques
        doc.querySelectorAll('hr').forEach((hr) => hr.remove())

        return doc.body.innerHTML.trim()
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
    cc?: string,
    bcc?: string,
    threadId?: string,
    inReplyTo?: string,
    references?: string,
    attachments: File[] = []
) {
    const boundary = `boundary_${Date.now().toString(16)}`
    const headers = [`To: ${to}`, `Subject: ${subject}`]

    if (cc) headers.push(`Cc: ${cc}`)
    if (bcc) headers.push(`Bcc: ${bcc}`)
    if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`)
    if (references) headers.push(`References: ${references}`)

    headers.push('MIME-Version: 1.0')
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)

    const messageParts = headers

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
