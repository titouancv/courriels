export interface Attachment {
    id: string
    filename: string
    mimeType: string
    size: number
    data?: string
    attachmentId?: string
    contentId?: string
}

export interface EmailMessage {
    id: string
    sender: {
        name: string
        email: string
        avatar?: string
    }
    content: string
    originalContent?: string
    date: Date
    attachments: Attachment[]
    messageIdHeader?: string
    references?: string
}

export interface Email {
    id: string
    threadId: string
    sender: {
        name: string
        email: string
        avatar?: string
    }
    subject: string
    preview: string
    messages: EmailMessage[]
    date: Date
    read: boolean
    labels: string[]
    folder: 'inbox' | 'sent' | 'drafts' | 'trash'
    isFullDetails?: boolean
}

export type FolderId = 'notifications' | 'conversations' | 'trash'

export interface User {
    email: string
    name: string
    picture?: string
}
