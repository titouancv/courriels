import { useState, useEffect, useRef } from 'react';
import type { Email } from '../types';
import { X, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../design-system/Button';
import { formatEmailDate } from '../utils/date';
import { MessageContent } from './MessageContent';
import { AttachmentItem } from './AttachmentItem';

interface EmailViewProps {
  email: Email | null;
  onSendReply: (body: string) => Promise<void>;
  currentUserEmail?: string;
  onFetchAttachment: (messageId: string, attachmentId: string) => Promise<string | null>;
  onClose: () => void;
}

export function EmailView({ email, onSendReply, currentUserEmail, onFetchAttachment, onClose }: EmailViewProps) {
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [email?.id, email?.messages.length]);

  if (!email) {
    return null;
  }

  const handleSend = async () => {
    if (!replyBody.trim()) return;
    setIsSending(true);
    try {
      await onSendReply(replyBody);
      setReplyBody('');
    } finally {
      setIsSending(false);
    }
  };

  const uniqueNames = Array.from(new Set(email.messages.map(m => m.sender.name)));

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] flex flex-col border-l border-[#E9E9E7] dark:border-[#2F2F2F]">
      <div className="p-4 border-b border-[#E9E9E7] dark:border-[#2F2F2F] sticky top-0 bg-white dark:bg-[#191919] z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-xl font-semibold text-[#37352F] dark:text-[#D4D4D4] truncate" title={email.subject}>{email.subject}</h1>
            <div className="text-sm text-[#787774] dark:text-[#9B9A97] mt-1 truncate">
              {uniqueNames.join(', ')}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#787774] dark:text-[#9B9A97] flex-shrink-0">
            <Button 
              variant="icon"
              size="icon"
              onClick={onClose}
              title="Close"
              icon={X}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {email.messages.map((message) => {
          const isMe = currentUserEmail && message.sender.email === currentUserEmail;
          return (
            <div key={message.id} className={clsx(
              "flex flex-col max-w-3xl",
              isMe ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={clsx("flex items-center gap-3 mb-2", isMe && "flex-row-reverse")}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00712D]/60 to-[#00712D] flex items-center justify-center text-white font-medium text-sm">
                  {message.sender.name[0]}
                </div>
                <div className={clsx("text-sm", isMe ? "text-right" : "text-left")}>
                  <div className="font-medium text-[#37352F] dark:text-[#D4D4D4]">{message.sender.name}</div>
                  <div className="text-xs text-[#787774] dark:text-[#9B9A97]">
                    {formatEmailDate(message.date, { includeTime: true })}
                  </div>
                </div>
              </div>
              
              <div className={clsx(
                "max-w-2xl p-4 rounded-lg prose prose-stone dark:prose-invert",
                isMe ? "bg-[#00712D]/5 dark:bg-[#00712D]/20 text-[#37352F] dark:text-[#D4D4D4]" : "bg-[#F7F7F5] dark:bg-[#202020] text-[#37352F] dark:text-[#D4D4D4]"
              )}>
                <MessageContent 
                  content={message.content} 
                  originalContent={message.originalContent}
                  attachments={message.attachments} 
                  messageId={message.id}
                  onFetchAttachment={onFetchAttachment}
                />
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-4 border-t border-black/5 dark:border-white/10 pt-4">
                    {message.attachments.filter(a => !a.contentId || !a.mimeType.startsWith('image/')).map(attachment => (
                      <AttachmentItem 
                        key={attachment.id}
                        attachment={attachment}
                        messageId={message.id}
                        onFetchAttachment={onFetchAttachment}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto p-4 border-t border-[#E9E9E7] dark:border-[#2F2F2F] bg-white dark:bg-[#191919]">
        <div className="flex gap-2 items-end">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-[#E9E9E7] dark:border-[#2F2F2F] rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00712D]/20 min-h-[80px] text-[#37352F] dark:text-[#D4D4D4] placeholder-[#9B9A97] bg-white dark:bg-[#202020]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!replyBody.trim() || isSending}
            variant="primary"
            size="icon"
            icon={Send}
            className="mb-1"
          />
        </div>
      </div>
    </div>
  );
}
