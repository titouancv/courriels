import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { EmailList } from './components/EmailList'
import { EmailView } from './components/EmailView'
import { ComposeView } from './components/ComposeView'
import { SearchModal } from './components/SearchModal'
import { LoginPage } from './components/LoginPage'
import { SettingsView } from './components/SettingsView'
import { clsx } from 'clsx'
import type { FolderId, Email } from './types'
import { sendEmailMessage, fetchAttachmentData } from './services/gmailApi'
import { getEmailsForFolder } from './services/emailService'
import { useAuth } from './hooks/useAuth'
import { useEmails } from './hooks/useEmails'
import { SkeletonTheme } from 'react-loading-skeleton'

function App() {
    const { user, accessToken, logout, setUser } = useAuth()
    const {
        conversationEmails,
        inboxEmails,
        trashEmails,
        isRefreshing,
        isLoading,
        nextPageToken,
        refreshEmails,
        unreadCounts,
        deleteEmail,
        markAsRead,
        loadFullEmail,
    } = useEmails(accessToken)

    const [currentFolder, setCurrentFolder] = useState<FolderId>('inbox')
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const [composeInitialTo, setComposeInitialTo] = useState('')
    const [composeInitialSubject, setComposeInitialSubject] = useState('')
    const [composeInitialBody, setComposeInitialBody] = useState('')
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<Email[]>([])
    const [isSearching, setIsSearching] = useState(false)

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

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    // Search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery && accessToken && isSearchOpen) {
                setIsSearching(true)
                try {
                    const { emails } = await getEmailsForFolder(
                        accessToken,
                        'inbox',
                        undefined,
                        searchQuery
                    )
                    setSearchResults(emails.slice(0, 10))
                } catch (error) {
                    console.error('Search failed', error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
                setSearchQuery('')
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, accessToken, isSearchOpen])

    // Folder refresh effect
    useEffect(() => {
        if (accessToken) {
            refreshEmails(currentFolder)
        }
    }, [currentFolder, accessToken, refreshEmails])

    useEffect(() => {
        if (selectedEmailId && accessToken) {
            loadFullEmail(selectedEmailId, currentFolder)
        }
    }, [selectedEmailId, currentFolder, accessToken, loadFullEmail])

    // URL Management
    useEffect(() => {
        if (!accessToken) return

        // 1. Read from URL on mount
        const params = new URLSearchParams(window.location.search)

        const folderParam = params.get('folder') as FolderId
        if (
            folderParam &&
            ['inbox', 'conversations', 'trash'].includes(folderParam)
        ) {
            setCurrentFolder(folderParam)
        }

        const emailIdParam = params.get('emailId')
        if (emailIdParam) {
            setSelectedEmailId(emailIdParam)
        }

        if (params.get('compose') === 'true') {
            setIsComposeOpen(true)
        }

        if (params.get('settings') === 'true') {
            setIsSettingsOpen(true)
        }
    }, [accessToken]) // Run once when authenticated

    // 2. Write to URL on state change
    useEffect(() => {
        if (!accessToken) return

        const params = new URLSearchParams(window.location.search)

        // Folder
        if (currentFolder !== 'inbox') {
            params.set('folder', currentFolder)
        } else {
            params.delete('folder')
        }

        // Email ID
        if (selectedEmailId) {
            params.set('emailId', selectedEmailId)
        } else {
            params.delete('emailId')
        }

        // Compose
        if (isComposeOpen) {
            params.set('compose', 'true')
        } else {
            params.delete('compose')
        }

        // Settings
        if (isSettingsOpen) {
            params.set('settings', 'true')
        } else {
            params.delete('settings')
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, '', newUrl)
    }, [
        currentFolder,
        selectedEmailId,
        isComposeOpen,
        isSettingsOpen,
        accessToken,
    ])

    const filteredEmails = (() => {
        let emails: Email[] = []
        if (currentFolder === 'conversations') emails = conversationEmails
        else if (currentFolder === 'inbox') emails = inboxEmails
        else if (currentFolder === 'trash') emails = trashEmails
        return emails
    })()

    const selectedEmail =
        conversationEmails.find((e) => e.id === selectedEmailId) ||
        inboxEmails.find((e) => e.id === selectedEmailId) ||
        trashEmails.find((e) => e.id === selectedEmailId) ||
        null

    if (!isLoading && !isRefreshing && selectedEmailId && !selectedEmail) {
        setSelectedEmailId(null)
    }

    const handleSendEmail = async (
        to: string,
        subject: string,
        body: string,
        cc?: string,
        bcc?: string,
        replyContext?: {
            threadId?: string
            inReplyTo?: string
            references?: string
        },
        attachments: File[] = []
    ) => {
        if (!accessToken) return

        try {
            await sendEmailMessage(
                accessToken,
                to,
                subject,
                body,
                cc,
                bcc,
                replyContext?.threadId,
                replyContext?.inReplyTo,
                replyContext?.references,
                attachments
            )
            toast.success('Email sent successfully')
            refreshEmails(currentFolder)
        } catch (error) {
            console.error('Error sending email:', error)
            toast.error('Failed to send email')
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

        await handleSendEmail(
            to,
            subject,
            body,
            undefined,
            undefined,
            replyContext,
            attachments
        )
    }

    const handleForward = (subject: string, body: string) => {
        setComposeInitialTo('')
        setComposeInitialSubject(subject)
        setComposeInitialBody(body)
        setIsComposeOpen(true)
    }

    const handleComposeOpen = () => {
        setComposeInitialTo('')
        setComposeInitialSubject('')
        setComposeInitialBody('')
        setIsComposeOpen(true)
        setSelectedEmailId(null)
    }

    const fetchAttachment = async (messageId: string, attachmentId: string) => {
        if (!accessToken) return null
        return fetchAttachmentData(accessToken, messageId, attachmentId)
    }

    const loadMore = () => {
        if (nextPageToken) {
            refreshEmails(currentFolder, nextPageToken, searchQuery)
        }
    }

    const hasMore = !!nextPageToken

    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    if (!accessToken) {
        return <LoginPage />
    }

    return (
        <SkeletonTheme
            baseColor={darkMode ? '#333' : '#ebebeb'}
            highlightColor={darkMode ? '#444' : '#f5f5f5'}
        >
            <div className="flex h-dvh bg-white font-sans antialiased transition-colors duration-200 dark:bg-[#191919]">
                <Toaster position="bottom-right" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="relative flex min-h-0 flex-1">
                        {isSettingsOpen && user ? (
                            <SettingsView
                                user={user}
                                onUpdateUser={setUser}
                                onLogout={logout}
                                darkMode={darkMode}
                                toggleDarkMode={() => setDarkMode(!darkMode)}
                                onClose={() => setIsSettingsOpen(false)}
                            />
                        ) : (
                            <>
                                <Sidebar
                                    currentFolder={currentFolder}
                                    onFolderChange={(folder) => {
                                        setCurrentFolder(folder)
                                        setIsSettingsOpen(false)
                                    }}
                                    user={user}
                                    onOpenSettings={() => {
                                        setIsSettingsOpen(true)
                                        setSelectedEmailId(null)
                                    }}
                                    unreadCounts={unreadCounts}
                                    onCompose={handleComposeOpen}
                                    onSearch={() => setIsSearchOpen(true)}
                                />
                                <EmailList
                                    emails={filteredEmails}
                                    selectedEmailId={
                                        selectedEmail ? selectedEmailId : null
                                    }
                                    onSelectEmail={(id) => {
                                        setSelectedEmailId(id)
                                        setIsComposeOpen(false)
                                        const email = filteredEmails.find(
                                            (e) => e.id === id
                                        )
                                        if (email && !email.read) {
                                            markAsRead(
                                                email.id,
                                                email.threadId,
                                                currentFolder
                                            )
                                        }
                                    }}
                                    onRefresh={() =>
                                        refreshEmails(
                                            currentFolder,
                                            undefined,
                                            searchQuery
                                        )
                                    }
                                    isRefreshing={isRefreshing}
                                    onLoadMore={loadMore}
                                    hasMore={hasMore}
                                    currentUser={user}
                                    searchQuery={searchQuery}
                                    currentFolder={currentFolder}
                                    className={clsx(
                                        (isComposeOpen ||
                                            (selectedEmailId &&
                                                selectedEmail)) &&
                                            'hidden md:flex'
                                    )}
                                />
                                {(isComposeOpen ||
                                    (selectedEmailId && selectedEmail)) && (
                                    <div className="absolute inset-0 z-10 flex flex-col bg-white md:static md:min-w-0 md:flex-1 dark:bg-[#191919]">
                                        {isComposeOpen ? (
                                            <ComposeView
                                                onClose={() =>
                                                    setIsComposeOpen(false)
                                                }
                                                onSend={handleSendEmail}
                                                initialTo={composeInitialTo}
                                                initialSubject={
                                                    composeInitialSubject
                                                }
                                                initialBody={composeInitialBody}
                                            />
                                        ) : (
                                            <EmailView
                                                email={selectedEmail}
                                                onSendReply={handleInlineReply}
                                                onForward={handleForward}
                                                onDelete={(emailId, threadId) =>
                                                    deleteEmail(
                                                        emailId,
                                                        threadId,
                                                        currentFolder
                                                    )
                                                }
                                                onMarkAsRead={(
                                                    emailId,
                                                    threadId
                                                ) =>
                                                    markAsRead(
                                                        emailId,
                                                        threadId,
                                                        currentFolder
                                                    )
                                                }
                                                currentUserEmail={user?.email}
                                                onFetchAttachment={
                                                    fetchAttachment
                                                }
                                                onClose={() =>
                                                    setSelectedEmailId(null)
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <SearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearch}
                    results={searchResults}
                    isLoading={isSearching}
                    onSelectResult={(emailId) => {
                        setSelectedEmailId(emailId)
                        setIsSearchOpen(false)
                        // We might need to load the email if it's not in the current list
                        // But loadFullEmail should handle it if we pass the ID
                    }}
                />
            </div>
        </SkeletonTheme>
    )
}

export default App
