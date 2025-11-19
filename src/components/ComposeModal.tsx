import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../design-system/Button';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
  initialTo?: string;
  initialSubject?: string;
}

export function ComposeModal({ isOpen, onClose, onSend, initialTo = '', initialSubject = '' }: ComposeModalProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
    }
  }, [isOpen, initialTo, initialSubject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await onSend(to, subject, body);
      onClose();
      setTo('');
      setSubject('');
      setBody('');
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-24 w-[600px] bg-white dark:bg-[#191919] rounded-t-lg shadow-2xl border border-[#E9E9E7] dark:border-[#2F2F2F] z-50 flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F5] dark:bg-[#202020] rounded-t-lg border-b border-[#E9E9E7] dark:border-[#2F2F2F]">
        <h3 className="font-medium text-[#37352F] dark:text-[#D4D4D4]">New Message</h3>
        <div className="flex items-center gap-2 text-[#787774] dark:text-[#9B9A97]">
          <Button variant="icon" size="icon" onClick={onClose} icon={X} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-[#E9E9E7] dark:border-[#2F2F2F]">
          <input
            type="email"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full outline-none text-[#37352F] dark:text-[#D4D4D4] placeholder-[#9B9A97] bg-transparent"
            required
          />
        </div>
        <div className="px-4 py-2 border-b border-[#E9E9E7] dark:border-[#2F2F2F]">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full outline-none font-medium text-[#37352F] dark:text-[#D4D4D4] placeholder-[#9B9A97] bg-transparent"
            required
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 p-4 outline-none resize-none text-[#37352F] dark:text-[#D4D4D4] placeholder-[#9B9A97] bg-transparent"
          placeholder="Type your message..."
          required
        />
        <div className="p-4 border-t border-[#E9E9E7] dark:border-[#2F2F2F] flex justify-end">
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
  );
}
