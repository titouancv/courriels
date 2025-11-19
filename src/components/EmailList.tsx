import type { Email, User, FolderId } from '../types';
import { clsx } from 'clsx';
import { RotateCw } from 'lucide-react';
import { Button } from '../design-system/Button';
import { formatEmailDate } from '../utils/date';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUser: User | null;
  searchQuery?: string;
  currentFolder: FolderId;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail, onRefresh, isRefreshing, onLoadMore, hasMore, currentUser, searchQuery, currentFolder }: EmailListProps) {
  const getTitle = () => {
    if (searchQuery) return 'Search';
    switch (currentFolder) {
      case 'notifications': return 'Notifications';
      case 'conversations': return 'Conversations';
      case 'trash': return 'Trash';
      default: return 'Inbox';
    }
  };

  return (
    <div className={clsx(
      "border-r border-[#E9E9E7] dark:border-[#2F2F2F] bg-white dark:bg-[#191919] h-full overflow-y-auto flex flex-col transition-all duration-300 ease-in-out",
      selectedEmailId ? "w-96" : "flex-1"
    )}>
      <div className="p-4 border-b border-[#E9E9E7] dark:border-[#2F2F2F] sticky top-0 bg-white dark:bg-[#191919] z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-medium text-[#37352F] dark:text-[#D4D4D4]">{getTitle()}</h2>
            <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-1">{emails.length} messages</p>
          </div>
          {onRefresh && (
            <Button 
              variant="icon"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={clsx(isRefreshing && "animate-spin", "dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]")}
              icon={RotateCw}
            />
          )}
        </div>
      </div>
      <div className="divide-y divide-[#E9E9E7] dark:divide-[#2F2F2F]">
        {emails.map((email) => {
          const otherSenders = email.messages.filter(m => m.sender.email !== currentUser?.email);
          const uniqueNames = Array.from(new Set(otherSenders.map(m => m.sender.name)));
          const displayName = uniqueNames.length > 0 ? uniqueNames.join(', ') : email.sender.name;

          let avatarName = email.sender.name;
          let avatarUrl = undefined;
          
          if (otherSenders.length > 0) {
             const lastOther = otherSenders[otherSenders.length - 1];
             avatarName = lastOther.sender.name;
          } else {
             if (currentUser && currentUser.email === email.sender.email) {
                 avatarUrl = currentUser.picture;
             }
          }

          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email.id)}
              className={clsx(
                'p-4 cursor-pointer hover:bg-[#F7F7F5] dark:hover:bg-[#202020] transition-colors flex gap-3',
                selectedEmailId === email.id ? 'bg-[#F7F7F5] dark:bg-[#202020]' : 'bg-white dark:bg-[#191919]',
                !email.read && 'bg-[#00712D]/5 dark:bg-[#00712D]/20'
              )}
            >
              <div className="flex-shrink-0 mt-1">
                 {avatarUrl ? (
                    <img src={avatarUrl} alt={avatarName} className="w-8 h-8 rounded-full object-cover" />
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00712D]/60 to-[#00712D] flex items-center justify-center text-white font-medium text-xs">
                      {avatarName[0]}
                    </div>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={clsx("text-sm truncate pr-2", !email.read ? "font-semibold text-[#37352F] dark:text-white" : "text-[#37352F] dark:text-[#D4D4D4]")}>
                    {displayName}
                  </span>
                  <span className="text-xs text-[#9B9A97] whitespace-nowrap">
                    {formatEmailDate(email.date)}
                  </span>
                </div>
                <div className={clsx("text-xs mb-1 truncate", !email.read ? "font-medium text-[#37352F] dark:text-white" : "text-[#37352F] dark:text-[#D4D4D4]")}>
                  {email.subject}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && onLoadMore && (
        <div className="p-4 border-t border-[#E9E9E7] dark:border-[#2F2F2F]">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isRefreshing}
            className="w-full dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]"
          >
            {isRefreshing ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
