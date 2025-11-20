import { useState, useRef } from 'react'
import { Paperclip, Send, X } from 'lucide-react'
import { Button } from '../design-system/Button'

interface ReplyBoxProps {
    onSend: (body: string, attachments: File[]) => Promise<void>
    isSending: boolean
}

export function ReplyBox({ onSend, isSending }: ReplyBoxProps) {
    const [body, setBody] = useState('')
    const [attachments, setAttachments] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setAttachments((prev) => [...prev, ...newFiles])
        }
        // Reset input so same file can be selected again if needed
        e.target.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSend = async () => {
        if (!body.trim() && attachments.length === 0) return

        try {
            await onSend(body, attachments)
            setBody('')
            setAttachments([])
        } catch (error) {
            console.error('Failed to send reply:', error)
        }
    }

    return (
        <div className="mt-auto border-t border-[#E9E9E7] bg-white p-4 dark:border-[#2F2F2F] dark:bg-[#191919]">
            {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-md bg-[#F7F7F5] px-3 py-1.5 text-sm text-[#37352F] dark:bg-[#202020] dark:text-[#D4D4D4]"
                        >
                            <span className="max-w-[200px] truncate">
                                {file.name}
                            </span>
                            <span className="text-xs text-[#787774] dark:text-[#9B9A97]">
                                ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                                onClick={() => removeAttachment(index)}
                                className="ml-1 rounded-full p-0.5 hover:bg-[#E9E9E7] dark:hover:bg-[#2F2F2F]"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="relative flex-1">
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[80px] w-full resize-none rounded-lg border border-[#E9E9E7] bg-white p-3 text-[#37352F] placeholder-[#9B9A97] focus:ring-2 focus:ring-[#00712D]/20 focus:outline-none dark:border-[#2F2F2F] dark:bg-[#202020] dark:text-[#D4D4D4]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSend()
                            }
                        }}
                    />
                    <div className="absolute right-2 bottom-2">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            icon={Paperclip}
                            title="Attach files"
                            className="h-8 w-8 text-[#787774] hover:text-[#37352F] dark:text-[#9B9A97] dark:hover:text-[#D4D4D4]"
                        />
                    </div>
                </div>
                <Button
                    onClick={handleSend}
                    disabled={
                        (!body.trim() && attachments.length === 0) || isSending
                    }
                    variant="primary"
                    size="icon"
                    icon={Send}
                    className="mb-1"
                />
            </div>
        </div>
    )
}
