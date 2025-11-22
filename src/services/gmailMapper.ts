/* eslint-disable @typescript-eslint/no-explicit-any */
import DOMPurify from 'dompurify'
import type { Attachment, Email, EmailMessage } from '../types'

// -------------------------------
// BASE64URL → UTF-8
// -------------------------------
export function decodeEmailBody(data: string): string {
    try {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }

        return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch (e) {
        console.error('Decode error:', e)
        return ''
    }
}

export function plainTextToHtml(text: string): string {
    if (!text) return ''

    // 1️⃣ Détection des anciens messages dans text/plain
    const replyHeaderRegex =
        /(On\s.+?wrote:)|(Le\s.+?a écrit)|(From:\s.+)|(Sent:\s.+)|(To:\s.+)|(De :\s.+)/i

    // Couper tout ce qui suit l’en-tête de reply
    const lines = text.split('\n')
    const cleanedLines: string[] = []

    for (const line of lines) {
        if (replyHeaderRegex.test(line.trim())) break
        cleanedLines.push(line)
    }

    let cleanedText = cleanedLines.join('\n')

    // 2️⃣ Échapper HTML
    cleanedText = cleanedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // 3️⃣ Auto-link des URLs
    cleanedText = cleanedText.replace(
        /(https?:\/\/[^\s]+|www\.[^\s]+)/g,
        (url) => {
            const href = url.startsWith('http') ? url : `https://${url}`
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`
        }
    )

    // 4️⃣ Sauts de ligne -> HTML
    return cleanedText.replace(/\n/g, '<br />')
}

// -------------------------------
// EXTRACTION DU CORPS HTML / TEXT
// -------------------------------
export function getMessageBody(payload: any): string {
    if (!payload) return ''

    // 1️⃣ Si mimeType === text/html
    if (payload.mimeType === 'text/html' && payload.body?.data) {
        return decodeEmailBody(payload.body.data)
    }

    // 2️⃣ Si mimeType === text/plain
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
        const text = decodeEmailBody(payload.body.data)
        return plainTextToHtml(text)
    }

    // 3️⃣ multipart/* → on descend dans les parts
    if (payload.parts && Array.isArray(payload.parts)) {
        // priorité HTML
        for (const part of payload.parts) {
            const result = getMessageBody(part)
            if (result && part.mimeType === 'text/html') return result
        }

        // fallback texte simple
        for (const part of payload.parts) {
            const result = getMessageBody(part)
            if (result && part.mimeType === 'text/plain') return result
        }

        // fallback : premier contenu non vide trouvé
        for (const part of payload.parts) {
            const result = getMessageBody(part)
            if (result) return result
        }
    }

    return ''
}

// -------------------------------
// ATTACHMENTS (incl. inline CID)
// -------------------------------
export function getAttachments(payload: any): Attachment[] {
    if (!payload) return []

    let list: Attachment[] = []

    const headers = payload.headers || []

    const contentId = headers
        .find(
            (h: any) =>
                h.name?.toLowerCase() === 'content-id' ||
                h.name?.toLowerCase() === 'x-attachment-id'
        )
        ?.value?.replace(/[<>]/g, '')

    // Pièce jointe réelle
    if (payload.filename && payload.body?.attachmentId) {
        list.push({
            id: payload.body.attachmentId,
            filename: payload.filename,
            mimeType: payload.mimeType,
            size: payload.body.size || 0,
            attachmentId: payload.body.attachmentId,
            contentId: contentId || null,
        })
    }

    // Récursion
    if (payload.parts) {
        for (const part of payload.parts) {
            list = [...list, ...getAttachments(part)]
        }
    }

    return list
}

// -------------------------------
// NETTOYAGE DU HTML
// -------------------------------
export function cleanEmailContent(html: string): string {
    try {
        const sanitized = DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            ADD_ATTR: ['target', 'class', 'style', 'id'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
            FORBID_ATTR: ['onmouseover', 'onclick', 'onerror'],
        })

        const parser = new DOMParser()
        const doc = parser.parseFromString(sanitized, 'text/html')

        // Supprimer les citations Gmail / Proton
        doc.querySelectorAll(
            '.gmail_quote, .gmail_attr, .protonmail_quote'
        ).forEach((el) => el.remove())

        // Supprimer les blockquotes
        doc.querySelectorAll('blockquote').forEach((el) => el.remove())

        // Supprimer div avec border-left: solid (style Gmail/Outlook quotes)
        doc.querySelectorAll('div').forEach((div) => {
            const style = div.getAttribute('style')
            if (
                style &&
                style.includes('border-left') &&
                style.includes('solid')
            ) {
                div.remove()
            }
        })

        return doc.body.innerHTML.trim()
    } catch (e) {
        console.error('HTML clean error:', e)
        return DOMPurify.sanitize(html)
    }
}

// -------------------------------
// CONVERSION DES MESSAGES
// -------------------------------
export function messageFromThreadData(threadData: any): EmailMessage[] {
    return threadData.messages.map((msgData: any) => {
        const headers = msgData.payload.headers

        const getHeader = (name: string) =>
            headers.find(
                (h: { name: string; value: string }) =>
                    h.name.toLowerCase() === name.toLowerCase()
            )?.value || ''

        const from = getHeader('From')
        const messageIdHeader =
            getHeader('Message-ID') || getHeader('Message-Id')
        const references = getHeader('References')

        const dateRaw = getHeader('Date') || Number(msgData.internalDate)
        const date = new Date(dateRaw)

        // Parsing du sender
        const match = from.match(/(.+?)\s*<(.+?)>/)
        const senderName = match
            ? match[1].replace(/"/g, '').trim()
            : from.split('@')[0]
        const senderEmail = match ? match[2] : from

        // Contenu
        const rawContent = getMessageBody(msgData.payload)
        let cleanedContent = cleanEmailContent(rawContent).trim()

        if (!cleanedContent) cleanedContent = rawContent

        // Pièces jointes
        const attachments = getAttachments(msgData.payload)

        return {
            id: msgData.id,
            sender: {
                name: senderName,
                email: senderEmail,
            },
            content: cleanedContent,
            date,
            attachments,
            messageIdHeader,
            references,
        } as EmailMessage
    })
}

// -------------------------------
// CONVERSION THREAD → STRUCTURE EMAIL
// -------------------------------
export function mapThreadToEmail(threadData: any, isFullDetails = true): Email {
    const messages = messageFromThreadData(threadData)
    const lastMsg = threadData.messages[threadData.messages.length - 1]

    const isUnread = threadData.messages.some((msg: any) =>
        msg.labelIds?.includes('UNREAD')
    )

    // Sujet du premier message
    const firstHeaders = threadData.messages[0].payload.headers
    const getFirstHeader = (name: string) =>
        firstHeaders.find(
            (h: { name: string; value: string }) =>
                h.name.toLowerCase() === name.toLowerCase()
        )?.value || ''

    const subject = getFirstHeader('Subject') || '(No Subject)'

    const labelIds = lastMsg.labelIds || []

    let folder: 'inbox' | 'sent' | 'drafts' | 'trash' = 'inbox'
    if (labelIds.includes('TRASH')) folder = 'trash'
    else if (labelIds.includes('SENT') && !labelIds.includes('INBOX'))
        folder = 'sent'
    else if (labelIds.includes('DRAFT')) folder = 'drafts'

    return {
        id: threadData.id,
        threadId: threadData.id,
        sender: messages[messages.length - 1].sender,
        subject,
        preview: lastMsg.snippet,
        messages,
        date: messages[messages.length - 1].date,
        read: !isUnread,
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
        folder,
        isFullDetails,
    }
}
