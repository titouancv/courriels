import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { EmailList } from './components/EmailList'
import { EmailView } from './components/EmailView'
import { ComposeView } from './components/ComposeView'
import { SearchInput } from './design-system/SearchInput'
import { LoginPage } from './components/LoginPage'
import { SettingsView } from './components/SettingsView'
import { Button } from './design-system/Button'
import { Plus, Menu } from 'lucide-react'
import { clsx } from 'clsx'
import type { FolderId, Email } from './types'
import { sendEmailMessage, fetchAttachmentData } from './services/gmailApi'
import { useAuth } from './hooks/useAuth'
import { useEmails } from './hooks/useEmails'

function App() {
    const { user, accessToken, logout, setUser } = useAuth()
    const {
        conversationEmails,
        notificationEmails,
        trashEmails,
        isRefreshing,
        isLoading,
        nextPageToken,
        refreshEmails,
        unreadCounts,
        deleteEmail,
        markAsRead,
    } = useEmails(accessToken)

    const [currentFolder, setCurrentFolder] = useState<FolderId>(() => {
        if (typeof window === 'undefined') return 'conversations'
        const params = new URLSearchParams(window.location.search)
        const folder = params.get('folder') as FolderId
        return folder &&
            ['conversations', 'notifications', 'trash'].includes(folder)
            ? folder
            : 'conversations'
    })
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
        () => {
            if (typeof window === 'undefined') return null
            const params = new URLSearchParams(window.location.search)
            return params.get('emailId') || null
        }
    )
    const [searchQuery, setSearchQuery] = useState('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const [isComposeOpen, setIsComposeOpen] = useState(() => {
        if (typeof window === 'undefined') return false
        const params = new URLSearchParams(window.location.search)
        return params.get('compose') === 'true'
    })
    const [composeInitialTo, setComposeInitialTo] = useState('')
    const [composeInitialSubject, setComposeInitialSubject] = useState('')
    const [composeInitialBody, setComposeInitialBody] = useState('')
    const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
        if (typeof window === 'undefined') return false
        const params = new URLSearchParams(window.location.search)
        return params.get('settings') === 'true'
    })

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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (accessToken) {
                refreshEmails(
                    currentFolder,
                    undefined,
                    searchQuery || undefined
                )
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery, currentFolder, accessToken, refreshEmails])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!accessToken) return

        const params = new URLSearchParams()
        if (currentFolder !== 'conversations')
            params.set('folder', currentFolder)
        if (selectedEmailId) params.set('emailId', selectedEmailId)
        if (isComposeOpen) params.set('compose', 'true')
        if (isSettingsOpen) params.set('settings', 'true')

        const queryString = params.toString()
        const newUrl = queryString
            ? `${window.location.pathname}?${queryString}`
            : window.location.pathname

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
        else if (currentFolder === 'notifications') emails = notificationEmails
        else if (currentFolder === 'trash') emails = trashEmails
        return emails
    })()

    const selectedEmail =
        conversationEmails.find((e) => e.id === selectedEmailId) ||
        notificationEmails.find((e) => e.id === selectedEmailId) ||
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
        <div className="flex h-screen bg-white font-sans antialiased transition-colors duration-200 dark:bg-[#191919]">
            <Toaster position="bottom-right" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <Sidebar
                    currentFolder={currentFolder}
                    onFolderChange={(folder) => {
                        setCurrentFolder(folder)
                        setIsSettingsOpen(false)
                        setIsMobileMenuOpen(false)
                    }}
                    user={user}
                    onOpenSettings={() => {
                        setIsSettingsOpen(true)
                        setSelectedEmailId(null)
                        setIsMobileMenuOpen(false)
                    }}
                    unreadCounts={unreadCounts}
                />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {!isSettingsOpen && (
                    <div className="flex h-16 items-center justify-between gap-4 border-b border-[#E9E9E7] bg-white px-4 md:px-6 dark:border-[#2F2F2F] dark:bg-[#191919]">
                        <Button
                            variant="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(true)}
                            icon={Menu}
                        />
                        <div className="flex-1 md:w-96 md:flex-none">
                            <SearchInput
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search..."
                            />
                        </div>
                        <Button
                            onClick={handleComposeOpen}
                            icon={Plus}
                            className="shrink-0"
                        >
                            <span className="hidden md:inline">
                                New Message
                            </span>
                            <span className="md:hidden">New</span>
                        </Button>
                    </div>
                )}

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
                            <EmailList
                                emails={filteredEmails}
                                selectedEmailId={
                                    selectedEmail ? selectedEmailId : null
                                }
                                onSelectEmail={(id) => {
                                    setSelectedEmailId(id)
                                    setIsComposeOpen(false)
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
                                        (selectedEmailId && selectedEmail)) &&
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
                                            onMarkAsRead={(emailId, threadId) =>
                                                markAsRead(
                                                    emailId,
                                                    threadId,
                                                    currentFolder
                                                )
                                            }
                                            currentUserEmail={user?.email}
                                            onFetchAttachment={fetchAttachment}
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
        </div>
    )
}

export default App
