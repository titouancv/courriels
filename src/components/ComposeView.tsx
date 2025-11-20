import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../design-system/Button'

interface ComposeViewProps {
    onClose: () => void
    onSend: (
        to: string,
        subject: string,
        body: string,
        cc?: string,
        bcc?: string
    ) => Promise<void>
    initialTo?: string
    initialSubject?: string
    initialBody?: string
}

export function ComposeView({
    onClose,
    onSend,
    initialTo = '',
    initialSubject = '',
    initialBody = '',
}: ComposeViewProps) {
    const [to, setTo] = useState(initialTo)
    const [cc, setCc] = useState('')
    const [bcc, setBcc] = useState('')
    const [showCc, setShowCc] = useState(false)
    const [showBcc, setShowBcc] = useState(false)
    const [subject, setSubject] = useState(initialSubject)
    const [body, setBody] = useState(initialBody)
    const [isSending, setIsSending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        try {
            await onSend(to, subject, body, cc, bcc)
            onClose()
        } catch (error) {
            console.error('Failed to send email:', error)
            toast.error('Failed to send email')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex h-full flex-1 flex-col overflow-y-auto border-l border-[#E9E9E7] bg-white dark:border-[#2F2F2F] dark:bg-[#191919]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
                <h2 className="text-xl font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                    New Message
                </h2>
                <div className="flex items-center gap-2 text-[#787774] dark:text-[#9B9A97]">
                    <Button
                        variant="icon"
                        size="icon"
                        onClick={onClose}
                        icon={X}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                <div className="border-b border-[#E9E9E7] px-4 py-2 dark:border-[#2F2F2F]">
                    <div className="flex items-center justify-between">
                        <input
                            type="email"
                            placeholder="To"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full bg-transparent text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                            required
                            autoFocus
                        />
                        <div className="flex gap-2">
                            {!showCc && (
                                <button
                                    type="button"
                                    onClick={() => setShowCc(true)}
                                    className="text-sm text-[#787774] hover:text-[#37352F] dark:text-[#9B9A97] dark:hover:text-[#D4D4D4]"
                                >
                                    Cc
                                </button>
                            )}
                            {!showBcc && (
                                <button
                                    type="button"
                                    onClick={() => setShowBcc(true)}
                                    className="text-sm text-[#787774] hover:text-[#37352F] dark:text-[#9B9A97] dark:hover:text-[#D4D4D4]"
                                >
                                    Bcc
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {showCc && (
                    <div className="border-b border-[#E9E9E7] px-4 py-2 dark:border-[#2F2F2F]">
                        <input
                            type="email"
                            placeholder="Cc"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            className="w-full bg-transparent text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                        />
                    </div>
                )}
                {showBcc && (
                    <div className="border-b border-[#E9E9E7] px-4 py-2 dark:border-[#2F2F2F]">
                        <input
                            type="email"
                            placeholder="Bcc"
                            value={bcc}
                            onChange={(e) => setBcc(e.target.value)}
                            className="w-full bg-transparent text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                        />
                    </div>
                )}
                <div className="border-b border-[#E9E9E7] px-4 py-2 dark:border-[#2F2F2F]">
                    <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-transparent font-medium text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                        required
                    />
                </div>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="flex-1 resize-none bg-transparent p-4 text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                    placeholder="Type your message..."
                    required
                />
                <div className="flex justify-end border-t border-[#E9E9E7] p-4 dark:border-[#2F2F2F]">
                    <Button
                        type="submit"
                        disabled={isSending}
                        isLoading={isSending}
                        className="bg-[#00712D] text-white hover:bg-[#005a24]"
                    >
                        Send Message
                    </Button>
                </div>
            </form>
        </div>
    )
}
