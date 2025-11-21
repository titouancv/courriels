import { useState, useRef, useEffect } from 'react'
import { Paperclip, Send, X, Sparkles } from 'lucide-react'
import { Button } from '../design-system/Button'
import { generateReply } from '../services/mistral'
import { toast } from 'sonner'

interface ReplyBoxProps {
    onSend: (body: string, attachments: File[]) => Promise<void>
    isSending: boolean
    thread?: string
}

export function ReplyBox({ onSend, isSending, thread }: ReplyBoxProps) {
    const [body, setBody] = useState('')
    const [attachments, setAttachments] = useState<File[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [body])

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
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // Error handled by parent
        }
    }

    const handleTextareaChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setBody(e.target.value)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }

    const handleGenerateReply = async () => {
        if (!thread) return

        const apiKey = import.meta.env.VITE_MISTRAL_API_KEY
        if (!apiKey) {
            toast.error('Mistral API key is missing in environment variables')
            return
        }

        setIsGenerating(true)
        try {
            const reply = await generateReply(thread, apiKey)
            setBody(reply)
        } catch (error) {
            toast.error('Failed to generate reply')
            console.error(error)
        } finally {
            setIsGenerating(false)
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
                <div className="flex-1 rounded-lg border border-[#E9E9E7] bg-white p-2 text-[#37352F] placeholder-[#9B9A97] focus:ring-2 focus:ring-[#00712D]/20 focus:outline-none dark:border-[#2F2F2F] dark:bg-[#202020] dark:text-[#D4D4D4]">
                    <textarea
                        ref={textareaRef}
                        value={body}
                        onChange={handleTextareaChange}
                        placeholder="Type a message..."
                        className="max-h-[350px] min-h-[80px] w-full resize-none p-3 focus:outline-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                handleSend()
                            }
                        }}
                    />
                    <div className="flex w-full justify-between">
                        {thread && (
                            <Button
                                variant="ai"
                                size="icon"
                                onClick={handleGenerateReply}
                                disabled={isGenerating}
                                icon={Sparkles}
                                title="Generate reply with AI"
                                className={` ${
                                    isGenerating ? 'animate-pulse' : ''
                                }`}
                            >
                                <span>Generate reply with AI</span>
                            </Button>
                        )}
                        <div className="flex items-center gap-2">
                            <div>
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
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    icon={Paperclip}
                                    title="Attach files"
                                    className="h-8 w-8 text-[#787774] hover:text-[#37352F] dark:text-[#9B9A97] dark:hover:text-[#D4D4D4]"
                                />
                            </div>
                            <Button
                                onClick={handleSend}
                                disabled={
                                    (!body.trim() &&
                                        attachments.length === 0) ||
                                    isSending
                                }
                                variant="primary"
                                size="icon"
                                icon={Send}
                                className=""
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
