/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import type { Email, FolderId } from '../types'
import { getEmailsForFolder, getEmailDetails } from '../services/emailService'
import {
    trashThread,
    modifyThreadLabels,
    getUnreadCountByCategory,
} from '../services/gmailApi'

export function useEmails(accessToken: string | null) {
    const [conversationEmails, setConversationEmails] = useState<Email[]>([])
    const [inboxEmails, setInboxEmails] = useState<Email[]>([])
    const [trashEmails, setTrashEmails] = useState<Email[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCounts, setUnreadCounts] = useState<{
        conversations: number
        inbox: number
        trash: number
    }>({ conversations: 0, inbox: 0, trash: 0 })
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const fetchIdRef = useRef(0)
    const activeRequestsRef = useRef(0)

    const refreshEmails = useCallback(
        async (
            currentFolder: FolderId,
            pageToken?: string,
            queryOverride?: string,
            targetFolder?: FolderId
        ) => {
            if (!accessToken) return

            const folderToFetch = targetFolder || currentFolder
            const currentFetchId = ++fetchIdRef.current
            activeRequestsRef.current++
            setIsRefreshing(true)
            try {
                const { emails, nextPageToken: newToken } =
                    await getEmailsForFolder(
                        accessToken,
                        folderToFetch,
                        pageToken,
                        queryOverride
                    )

                if (currentFetchId !== fetchIdRef.current && !targetFolder)
                    return

                if (!targetFolder) {
                    setNextPageToken(newToken)
                }

                const setEmails = (update: (prev: Email[]) => Email[]) => {
                    if (folderToFetch === 'conversations')
                        setConversationEmails(update)
                    else if (folderToFetch === 'inbox') {
                        setInboxEmails(update)
                    } else if (folderToFetch === 'trash') setTrashEmails(update)
                }

                if (pageToken) {
                    setEmails((prev) => [...prev, ...emails])
                } else {
                    setEmails(() => emails)
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
                toast.error('Failed to fetch emails')
                // We might want to handle token expiration here or in the auth hook
                if (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any).status === 401 ||
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any).message?.includes('401')
                ) {
                    // Let the parent handle logout/token clear via a callback or effect
                    // For now we just throw or return
                }
            } finally {
                activeRequestsRef.current--
                if (activeRequestsRef.current === 0) {
                    setIsRefreshing(false)
                }
            }
        },
        [accessToken]
    )

    // Initial fetch
    useEffect(() => {
        if (accessToken) {
            const init = async () => {
                setIsLoading(true)
                await Promise.all([
                    refreshEmails(
                        'conversations',
                        undefined,
                        undefined,
                        'conversations'
                    ),
                    refreshEmails('inbox', undefined, undefined, 'inbox'),
                    refreshEmails('trash', undefined, undefined, 'trash'),
                ])
                setIsLoading(false)
                setUnreadCounts({
                    conversations: await getUnreadCountByCategory(
                        accessToken,
                        'from:me is:unread'
                    ),
                    inbox: await getUnreadCountByCategory(
                        accessToken,
                        'label:INBOX is:unread'
                    ),
                    trash: await getUnreadCountByCategory(
                        accessToken,
                        'in:trash is:unread'
                    ),
                })
            }
            init()
        } else {
            setConversationEmails([])
            setInboxEmails([])
            setTrashEmails([])
        }
    }, [accessToken])

    const deleteEmail = async (
        emailId: string,
        threadId: string,
        folder: FolderId
    ) => {
        if (!accessToken) return

        const setEmails = (update: (prev: Email[]) => Email[]) => {
            if (folder === 'conversations') setConversationEmails(update)
            else if (folder === 'inbox') {
                setInboxEmails(update)
            } else if (folder === 'trash') setTrashEmails(update)
        }

        const previousEmails =
            folder === 'conversations'
                ? conversationEmails
                : folder === 'inbox'
                  ? inboxEmails
                  : trashEmails

        // Optimistic update
        setEmails((prev) => prev.filter((e) => e.id !== emailId))

        try {
            await trashThread(accessToken, threadId)
            toast.success('Email moved to trash')
        } catch (error) {
            console.error('Failed to delete email:', error)
            toast.error('Failed to delete email')
            // Revert
            setEmails(() => previousEmails)
        }
    }

    const markAsRead = async (
        emailId: string,
        threadId: string,
        folder: FolderId
    ) => {
        if (!accessToken) return

        const setEmails = (update: (prev: Email[]) => Email[]) => {
            if (folder === 'conversations') setConversationEmails(update)
            else if (folder === 'inbox') {
                setInboxEmails(update)
            } else if (folder === 'trash') setTrashEmails(update)
        }

        const previousEmails =
            folder === 'conversations'
                ? conversationEmails
                : folder === 'inbox'
                  ? inboxEmails
                  : trashEmails

        // Optimistic update
        setEmails((prev) =>
            prev.map((e) => (e.id === emailId ? { ...e, read: true } : e))
        )

        try {
            await modifyThreadLabels(accessToken, threadId, [], ['UNREAD'])
        } catch (error) {
            console.error('Failed to mark as read:', error)
            toast.error('Failed to mark as read')
            setEmails(() => previousEmails)
        }
    }

    const loadFullEmail = async (emailId: string, folder: FolderId) => {
        if (!accessToken) return

        const setEmails = (update: (prev: Email[]) => Email[]) => {
            if (folder === 'conversations') setConversationEmails(update)
            else if (folder === 'inbox') {
                setInboxEmails(update)
            } else if (folder === 'trash') setTrashEmails(update)
        }

        const emails =
            folder === 'conversations'
                ? conversationEmails
                : folder === 'inbox'
                  ? inboxEmails
                  : trashEmails

        const email = emails.find((e) => e.id === emailId)
        if (!email || email.isFullDetails) return

        try {
            const fullEmail = await getEmailDetails(accessToken, email.threadId)
            if (fullEmail) {
                setEmails((prev) =>
                    prev.map((e) => (e.id === emailId ? fullEmail : e))
                )
            }
        } catch (error) {
            console.error('Failed to load full email:', error)
        }
    }

    return {
        conversationEmails,
        inboxEmails,
        trashEmails,
        isRefreshing,
        isLoading,
        nextPageToken,
        refreshEmails,
        unreadCounts,
        setConversationEmails,
        setInboxEmails,
        setTrashEmails,
        deleteEmail,
        markAsRead,
        loadFullEmail,
    }
}
