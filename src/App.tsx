/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { EmailList } from './components/EmailList'
import { EmailView } from './components/EmailView'
import { ComposeModal } from './components/ComposeModal'
import { SearchInput } from './components/SearchInput'
import { LoginPage } from './components/LoginPage'
import { SettingsView } from './components/SettingsView'
import { Button } from './design-system/Button'
import { Plus } from 'lucide-react'
import type { FolderId, User, Email } from './types'
import { supabase, saveUserToSupabase, getUserProfile } from './lib/supabase'
import {
    fetchThreadsList,
    fetchThreadDetails,
    fetchUserInfo as fetchUserInfoService,
    sendEmailMessage,
    fetchAttachmentData,
} from './services/gmail'

function App() {
    const [currentFolder, setCurrentFolder] =
        useState<FolderId>('conversations')
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [emails, setEmails] = useState<Email[]>([])
    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const [composeInitialTo, setComposeInitialTo] = useState('')
    const [composeInitialSubject, setComposeInitialSubject] = useState('')
    const [composeThreadId, setComposeThreadId] = useState<string | undefined>(
        undefined
    )
    const [composeInReplyTo, setComposeInReplyTo] = useState<
        string | undefined
    >(undefined)
    const [composeReferences, setComposeReferences] = useState<
        string | undefined
    >(undefined)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return (
                localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches)
            )
        }
        return false
    })
    const [unreadCounts, setUnreadCounts] = useState<Record<FolderId, number>>({
        conversations: 0,
        notifications: 0,
        trash: 0,
    })
    const fetchIdRef = useRef(0)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    const filteredEmails = emails.filter((email) => {
        if (searchQuery) return true
        if (currentFolder === 'notifications')
            return email.messages.length === 1 && email.folder === 'inbox'
        if (currentFolder === 'conversations')
            return (
                (email.messages.length > 1 || email.folder === 'sent') &&
                email.folder !== 'trash'
            )
        return email.folder === 'trash'
    })
    const selectedEmail =
        emails.find((email) => email.id === selectedEmailId) || null

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.provider_token) {
                setAccessToken(session.provider_token)
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.provider_token) {
                setAccessToken(session.provider_token)
            } else {
                setAccessToken(null)
                setUser(null)
                setEmails([])
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setAccessToken(null)
        setUser(null)
        setEmails([])
    }

    const refreshEmails = async (
        pageToken?: string,
        queryOverride?: string
    ) => {
        if (!accessToken) return

        const currentFetchId = ++fetchIdRef.current
        setIsRefreshing(true)
        try {
            let query = ''
            const activeSearch =
                queryOverride !== undefined ? queryOverride : searchQuery

            if (activeSearch) {
                query = activeSearch
            } else {
                switch (currentFolder) {
                    case 'notifications':
                        query = ''
                        break
                    case 'conversations':
                        query = 'from:me'
                        break
                    case 'trash':
                        query = 'in:trash'
                        break
                }
            }

            const listData = await fetchThreadsList(
                accessToken,
                query,
                pageToken
            )

            if (currentFetchId !== fetchIdRef.current) return

            setNextPageToken(listData.nextPageToken || null)

            if (!listData.threads) {
                if (!pageToken) setEmails([])
                return
            }

            // Fetch details for each thread
            const emailPromises = listData.threads.map(
                (thread: { id: string }) =>
                    fetchThreadDetails(accessToken, thread.id)
            )
            const fetchedEmails = await Promise.all(emailPromises)

            if (currentFetchId !== fetchIdRef.current) return

            if (pageToken) {
                setEmails((prev) => [...prev, ...fetchedEmails])
            } else {
                setEmails(fetchedEmails)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
            // If token is invalid, clear it
            if (
                (error as any).status === 401 ||
                (error as any).message?.includes('401')
            ) {
                localStorage.removeItem('gmail_token')
                setAccessToken(null)
                setUser(null)
            }
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setIsRefreshing(false)
            }
        }
    }

    useEffect(() => {
        if (!accessToken) return

        const fetchUserInfo = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (session?.user?.id) {
                    const profile = await getUserProfile(session.user.id)

                    if (profile) {
                        setUser({
                            email: profile.email,
                            name: profile.full_name,
                            picture: profile.avatar_url,
                        })
                    } else {
                        const userData = await fetchUserInfoService(accessToken)
                        setUser(userData)
                        await saveUserToSupabase(userData, session.user.id)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user info:', error)
            }
        }

        fetchUserInfo()
        refreshEmails()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, currentFolder])

    useEffect(() => {
        emails.map((email) => {
            console.log(email.id, email.labels)
        })
        setUnreadCounts({
            conversations: emails.filter(
                (email) =>
                    (email.messages.length > 1 || email.folder === 'sent') &&
                    email.folder !== 'trash' &&
                    !email.read
            ).length,
            notifications: emails.filter(
                (email) =>
                    email.messages.length === 1 &&
                    email.folder === 'inbox' &&
                    !email.read
            ).length,
            trash: emails.filter(
                (email) => email.folder === 'trash' && !email.read
            ).length,
        })
    }, [emails])

    const handleSendEmail = async (
        to: string,
        subject: string,
        body: string,
        replyContext?: {
            threadId?: string
            inReplyTo?: string
            references?: string
        },
        attachments: File[] = []
    ) => {
        if (!accessToken) return

        const inReplyTo = replyContext?.inReplyTo || composeInReplyTo
        const references = replyContext?.references || composeReferences
        const threadId = replyContext?.threadId || composeThreadId

        try {
            await sendEmailMessage(
                accessToken,
                to,
                subject,
                body,
                threadId,
                inReplyTo,
                references,
                attachments
            )
        } catch (error) {
            console.error('Error sending email:', error)
            throw error
        }
    }

    const handleInlineReply = async (body: string, attachments: File[]) => {
        if (!selectedEmail) return

        const lastMessage =
            selectedEmail.messages[selectedEmail.messages.length - 1]
        const to = lastMessage.sender.email
        const subject = selectedEmail.subject.startsWith('Re:')
            ? selectedEmail.subject
            : `Re: ${selectedEmail.subject}`

        const replyContext = {
            threadId: selectedEmail.threadId,
            inReplyTo: lastMessage.messageIdHeader,
            references: lastMessage.references
                ? `${lastMessage.references} ${lastMessage.messageIdHeader}`
                : lastMessage.messageIdHeader,
        }

        await handleSendEmail(to, subject, body, replyContext, attachments)
        refreshEmails()
    }

    const handleComposeOpen = () => {
        setComposeInitialTo('')
        setComposeInitialSubject('')
        setComposeThreadId(undefined)
        setComposeInReplyTo(undefined)
        setComposeReferences(undefined)
        setIsComposeOpen(true)
    }

    const fetchAttachment = async (messageId: string, attachmentId: string) => {
        if (!accessToken) return null
        return fetchAttachmentData(accessToken, messageId, attachmentId)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        setNextPageToken(null)
        refreshEmails(undefined, query)
    }

    if (!accessToken) {
        return <LoginPage />
    }

    return (
        <div className="flex h-screen bg-white font-sans antialiased transition-colors duration-200 dark:bg-[#191919]">
            <Sidebar
                currentFolder={currentFolder}
                onFolderChange={(folder) => {
                    setCurrentFolder(folder)
                    setSearchQuery('')
                    setIsSettingsOpen(false)
                }}
                user={user}
                onOpenSettings={() => {
                    setIsSettingsOpen(true)
                    setSelectedEmailId(null)
                }}
                unreadCounts={unreadCounts}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                {!isSettingsOpen && (
                    <div className="flex h-16 items-center justify-between border-b border-[#E9E9E7] bg-white px-6 dark:border-[#2F2F2F] dark:bg-[#191919]">
                        <div className="w-96">
                            <SearchInput
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search emails..."
                            />
                        </div>
                        <Button onClick={handleComposeOpen} icon={Plus}>
                            New Message
                        </Button>
                    </div>
                )}

                <div className="flex min-h-0 flex-1">
                    {isSettingsOpen && user ? (
                        <SettingsView
                            user={user}
                            onUpdateUser={setUser}
                            onLogout={handleLogout}
                            darkMode={darkMode}
                            toggleDarkMode={() => setDarkMode(!darkMode)}
                        />
                    ) : (
                        <>
                            <EmailList
                                emails={filteredEmails}
                                selectedEmailId={selectedEmailId}
                                onSelectEmail={setSelectedEmailId}
                                onRefresh={() => refreshEmails()}
                                isRefreshing={isRefreshing}
                                onLoadMore={() =>
                                    nextPageToken &&
                                    refreshEmails(nextPageToken)
                                }
                                hasMore={!!nextPageToken}
                                currentUser={user}
                                searchQuery={searchQuery}
                                currentFolder={currentFolder}
                            />
                            <EmailView
                                email={selectedEmail}
                                onSendReply={handleInlineReply}
                                currentUserEmail={user?.email}
                                onFetchAttachment={fetchAttachment}
                                onClose={() => setSelectedEmailId(null)}
                            />
                        </>
                    )}
                </div>
            </div>

            <ComposeModal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                onSend={handleSendEmail}
                initialTo={composeInitialTo}
                initialSubject={composeInitialSubject}
            />
        </div>
    )
}

export default App
