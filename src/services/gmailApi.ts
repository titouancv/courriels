import type { User } from '../types'

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

export async function fetchThreadDetailsRaw(
    accessToken: string,
    threadId: string,
    format: 'full' | 'metadata' | 'minimal' = 'full'
) {
    const threadResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=${format}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!threadResponse.ok) {
        throw new Error(
            `Failed to fetch thread details: ${threadResponse.status} ${threadResponse.statusText}`
        )
    }
    return await threadResponse.json()
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
                `Content-Disposition: attachment; filename="${file.name}"`,
                'Content-Transfer-Encoding: base64',
                '',
                base64Content,
            ].join('\r\n')
        })
    )

    const email = [
        ...messageParts,
        '',
        ...bodyParts,
        ...attachmentParts,
        `--${boundary}--`,
    ].join('\r\n')

    const encodedMessage = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
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
        const errorData = await response.json()
        throw new Error(
            `Failed to send email: ${errorData.error?.message || response.statusText}`
        )
    }

    return await response.json()
}

export async function trashThread(accessToken: string, threadId: string) {
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/trash`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    )
    if (!response.ok) throw new Error('Failed to trash thread')
    return await response.json()
}

export async function modifyThreadLabels(
    accessToken: string,
    threadId: string,
    addLabels: string[],
    removeLabels: string[]
) {
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                addLabelIds: addLabels,
                removeLabelIds: removeLabels,
            }),
        }
    )
    if (!response.ok) throw new Error('Failed to modify thread labels')
    return await response.json()
}

export async function getUnreadCountByCategory(
    accessToken: string,
    query: string
): Promise<number> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}`

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch unread count')
    }

    const data = await response.json()

    // Gmail renvoie resultSizeEstimate → nombre de threads correspondant
    return data.resultSizeEstimate ?? 0
}
