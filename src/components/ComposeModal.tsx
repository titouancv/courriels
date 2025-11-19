import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../design-system/Button'

interface ComposeModalProps {
    isOpen: boolean
    onClose: () => void
    onSend: (to: string, subject: string, body: string) => Promise<void>
    initialTo?: string
    initialSubject?: string
}

export function ComposeModal({
    isOpen,
    onClose,
    onSend,
    initialTo = '',
    initialSubject = '',
}: ComposeModalProps) {
    const [to, setTo] = useState(initialTo)
    const [subject, setSubject] = useState(initialSubject)
    const [body, setBody] = useState('')
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setTo(initialTo)
            setSubject(initialSubject)
        }
    }, [isOpen, initialTo, initialSubject])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        try {
            await onSend(to, subject, body)
            onClose()
            setTo('')
            setSubject('')
            setBody('')
        } catch (error) {
            console.error('Failed to send email:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="fixed right-24 bottom-0 z-50 flex h-[600px] w-[600px] flex-col rounded-t-lg border border-[#E9E9E7] bg-white shadow-2xl dark:border-[#2F2F2F] dark:bg-[#191919]">
            <div className="flex items-center justify-between rounded-t-lg border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-3 dark:border-[#2F2F2F] dark:bg-[#202020]">
                <h3 className="font-medium text-[#37352F] dark:text-[#D4D4D4]">
                    New Message
                </h3>
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
                    <input
                        type="email"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full bg-transparent text-[#37352F] placeholder-[#9B9A97] outline-none dark:text-[#D4D4D4]"
                        required
                    />
                </div>
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
                    >
                        Send Message
                    </Button>
                </div>
            </form>
        </div>
    )
}
