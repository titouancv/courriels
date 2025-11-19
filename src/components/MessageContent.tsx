import { useState, useEffect } from 'react';
import type { Attachment } from '../types';
import { FileCode, MoreHorizontal } from 'lucide-react';
import { Button } from '../design-system/Button';

interface MessageContentProps {
  content: string;
  originalContent?: string;
  attachments: Attachment[];
  messageId: string;
  onFetchAttachment: (messageId: string, attachmentId: string) => Promise<string | null>;
}

export function MessageContent({ content, originalContent, attachments, messageId, onFetchAttachment }: MessageContentProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const activeContent = showOriginal ? (originalContent || content) : content;
  const [processedContent, setProcessedContent] = useState(activeContent);

  useEffect(() => {
    const processContent = async () => {
      if (!activeContent.includes('cid:')) {
        setProcessedContent(activeContent);
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(activeContent, 'text/html');
      const images = doc.querySelectorAll('img[src^="cid:"]');
      
      let hasChanges = false;
      for (const img of images) {
        const cid = img.getAttribute('src')?.replace('cid:', '');
        const attachment = attachments.find(a => a.contentId === cid);
        if (attachment && attachment.attachmentId) {
          const data = await onFetchAttachment(messageId, attachment.attachmentId);
          if (data) {
            img.setAttribute('src', `data:${attachment.mimeType};base64,${data}`);
            hasChanges = true;
          }
        }
      }
      
      if (hasChanges) {
        setProcessedContent(doc.body.innerHTML);
      } else {
        setProcessedContent(activeContent);
      }
    };
    
    processContent();
  }, [activeContent, attachments, messageId, onFetchAttachment]);

  return (
    <div className="relative group">
      {originalContent && (
        <div className="relative float-right">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="h-8 w-8 text-[#9B9A97] hover:text-[#37352F] dark:hover:text-[#D4D4D4] hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F]"
              icon={MoreHorizontal}
            />
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#191919] rounded-md shadow-lg border border-[#E9E9E7] dark:border-[#2F2F2F] z-20 py-1">
                  <button
                    onClick={() => {
                      setShowOriginal(!showOriginal);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#37352F] dark:text-[#D4D4D4] hover:bg-[#F7F7F5] dark:hover:bg-[#202020] flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4" />
                    {showOriginal ? 'Show cleaned view' : 'Show original format'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </div>
  );
}
