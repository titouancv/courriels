import React from 'react';
import type { FolderId, User } from '../types';
import { Bell, MessageSquare, Trash2, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useGoogleLogin, googleLogout, type TokenResponse } from '@react-oauth/google';
import { Button } from '../design-system/Button';

interface SidebarProps {
  currentFolder: FolderId;
  onFolderChange: (folder: FolderId) => void;
  user: User | null;
  onLoginSuccess: (tokenResponse: TokenResponse) => void;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Sidebar({ currentFolder, onFolderChange, user, onLoginSuccess, onLogout, darkMode, toggleDarkMode }: SidebarProps) {
  const login = useGoogleLogin({
    onSuccess: onLoginSuccess,
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
  });

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    googleLogout();
    onLogout();
  };

  const folders: { id: FolderId; icon: React.ElementType; label: string }[] = [
    { id: 'conversations', icon: MessageSquare, label: 'Conversations' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  return (
    <div className="w-64 bg-[#F7F7F5] dark:bg-[#202020] h-screen flex flex-col border-r border-[#E9E9E7] dark:border-[#2F2F2F] text-[#37352F] dark:text-[#D4D4D4] transition-colors duration-200">
      <div className="p-4">

        <div className="text-lg font-semibold mb-6">courriels</div>

        <div className="space-y-0.5">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="ghost"
              onClick={() => onFolderChange(folder.id)}
              className={clsx(
                'w-full justify-start dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]',
                currentFolder === folder.id && 'bg-[#EFEFED] text-[#37352F] dark:bg-[#2F2F2F] dark:text-white'
              )}
              icon={folder.icon}
            >
              {folder.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-[#E9E9E7] dark:border-[#2F2F2F]">
        <Button
          onClick={toggleDarkMode}
          variant="ghost"
          className="w-full justify-start dark:text-[#D4D4D4] dark:hover:bg-[#2F2F2F]"
          icon={darkMode ? Sun : Moon}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
                <div 
          className="flex items-center gap-2 px-2 py-1 hover:bg-[#EFEFED] dark:hover:bg-[#2F2F2F] rounded cursor-pointer transition-colors mb-4"
          onClick={() => !user && login()}
        >
          {user ? (
            <>
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-bold">
                  {user.name[0]}
                </div>
              )}
              <span className="font-medium text-sm truncate">{user.email}</span>
              <Button 
                variant="icon" 
                size="icon" 
                onClick={handleLogout} 
                className="ml-auto hover:text-red-500"
                title="Logout"
                icon={LogOut}
              />
            </>
          ) : (
            <>
              <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center text-white">
                <LogIn className="w-3 h-3" />
              </div>
              <span className="font-medium text-sm truncate">Connect Gmail</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
