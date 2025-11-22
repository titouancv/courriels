import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Button } from '../design-system/Button'
import type { Attachment } from '../types'

interface ImageStackProps {
    images: Attachment[]
    messageId: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
    onOpenLightbox: (index: number) => void
}

export function ImageStack({
    images,
    messageId,
    onFetchAttachment,
    onOpenLightbox,
}: ImageStackProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const coverImage = images[0]

    useEffect(() => {
        let mounted = true
        if (coverImage.attachmentId) {
            onFetchAttachment(messageId, coverImage.attachmentId).then(
                (data) => {
                    if (mounted && data) {
                        setCoverUrl(
                            `data:${coverImage.mimeType};base64,${data}`
                        )
                    }
                }
            )
        }
        return () => {
            mounted = false
        }
    }, [coverImage, messageId, onFetchAttachment])

    if (!coverUrl) return null

    return (
        <div
            className="group relative inline-block cursor-pointer"
            onClick={() => onOpenLightbox(0)}
        >
            {/* Stack effect layers */}
            {images.length > 1 && (
                <>
                    <div className="absolute top-2 -right-2 h-full w-full rotate-3 rounded-lg border border-[#E9E9E7] bg-white shadow-sm dark:border-[#2F2F2F] dark:bg-[#202020]" />
                    <div className="absolute top-1 -right-1 h-full w-full rotate-1 rounded-lg border border-[#E9E9E7] bg-white shadow-sm dark:border-[#2F2F2F] dark:bg-[#202020]" />
                </>
            )}

            {/* Main Image */}
            <div className="relative size-24 overflow-hidden rounded-lg border border-[#E9E9E7] bg-[#F7F7F5] shadow-sm dark:border-[#2F2F2F] dark:bg-[#202020]">
                <img
                    src={coverUrl}
                    alt={coverImage.filename}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                        <span className="text-xl font-semibold text-white">
                            +{images.length - 1}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

interface LightboxProps {
    images: Attachment[]
    initialIndex: number
    messageId: string
    onFetchAttachment: (
        messageId: string,
        attachmentId: string
    ) => Promise<string | null>
    onClose: () => void
}

export function Lightbox({
    images,
    initialIndex,
    messageId,
    onFetchAttachment,
    onClose,
}: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [currentUrl, setCurrentUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const currentImage = images[currentIndex]

    useEffect(() => {
        let mounted = true

        const fetchImage = async () => {
            setIsLoading(true)
            if (currentImage.attachmentId) {
                const data = await onFetchAttachment(
                    messageId,
                    currentImage.attachmentId
                )
                if (mounted && data) {
                    setCurrentUrl(
                        `data:${currentImage.mimeType};base64,${data}`
                    )
                }
                if (mounted) setIsLoading(false)
            }
        }

        fetchImage()

        return () => {
            mounted = false
        }
    }, [currentImage, messageId, onFetchAttachment])

    const handleDownload = () => {
        if (currentUrl) {
            const link = document.createElement('a')
            link.href = currentUrl
            link.download = currentImage.filename
            link.click()
        }
    }

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentIndex < images.length - 1) {
            setCurrentIndex((prev) => prev + 1)
        }
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1)
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight' && currentIndex < images.length - 1)
                setCurrentIndex((prev) => prev + 1)
            if (e.key === 'ArrowLeft' && currentIndex > 0)
                setCurrentIndex((prev) => prev - 1)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, images.length, onClose])

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={onClose}
        >
            <Button
                variant="icon"
                size="icon"
                className="absolute top-4 right-4 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={onClose}
                icon={X}
            />

            <div className="absolute top-4 left-4 text-white/70">
                {currentIndex + 1} / {images.length}
            </div>

            <Button
                variant="icon"
                size="icon"
                className="absolute top-4 right-16 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                }}
                icon={Download}
            />

            <div className="relative flex h-full w-full items-center justify-center px-12">
                {currentIndex > 0 && (
                    <Button
                        variant="icon"
                        size="icon"
                        className="absolute left-4 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={handlePrev}
                        icon={ChevronLeft}
                    />
                )}

                {isLoading ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : currentUrl ? (
                    <img
                        src={currentUrl}
                        alt={currentImage.filename}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : null}

                {currentIndex < images.length - 1 && (
                    <Button
                        variant="icon"
                        size="icon"
                        className="absolute right-4 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={handleNext}
                        icon={ChevronRight}
                    />
                )}
            </div>
        </div>,
        document.body
    )
}
