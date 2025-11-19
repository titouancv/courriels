import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailView } from './components/EmailView';
import { ComposeModal } from './components/ComposeModal';
import { SearchInput } from './components/SearchInput';
import { LoginPage } from './components/LoginPage';
import { Button } from './design-system/Button';
import { Plus } from 'lucide-react';
import type { FolderId, User, Email } from './types';
import type { TokenResponse } from '@react-oauth/google';
import { 
  fetchThreadsList, 
  fetchThreadDetails, 
  fetchUserInfo as fetchUserInfoService, 
  sendEmailMessage, 
  fetchAttachmentData 
} from './services/gmail';

function App() {
  const [currentFolder, setCurrentFolder] = useState<FolderId>('conversations');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [composeInitialSubject, setComposeInitialSubject] = useState('');
  const [composeThreadId, setComposeThreadId] = useState<string | undefined>(undefined);
  const [composeInReplyTo, setComposeInReplyTo] = useState<string | undefined>(undefined);
  const [composeReferences, setComposeReferences] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const filteredEmails = emails.filter(email => {
    if (searchQuery) return true;
    if (currentFolder === 'notifications') return email.messages.length === 1 && email.folder === 'inbox';
    if (currentFolder === 'conversations') return (email.messages.length > 1 || email.folder === 'sent') && email.folder !== 'trash';
    return email.folder === 'trash';
  });
  const selectedEmail = emails.find(email => email.id === selectedEmailId) || null;

  useEffect(() => {
    const storedToken = localStorage.getItem('gmail_token');
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (tokenResponse: TokenResponse) => {
    setAccessToken(tokenResponse.access_token);
    localStorage.setItem('gmail_token', tokenResponse.access_token);
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUser(null);
    setEmails([]);
    localStorage.removeItem('gmail_token');
  };

  const refreshEmails = async (pageToken?: string, queryOverride?: string) => {
    if (!accessToken) return;
    
    const currentFetchId = ++fetchIdRef.current;
    setIsRefreshing(true);
    try {
      let query = '';
      const activeSearch = queryOverride !== undefined ? queryOverride : searchQuery;

      if (activeSearch) {
        query = activeSearch;
      } else {
        switch (currentFolder) {
          case 'notifications':
            query = 'label:INBOX -from:me';
            break;
          case 'conversations':
            query = 'label:INBOX OR label:SENT';
            break;
          case 'trash':
            query = 'label:TRASH';
            break;
        }
      } 

      const listData = await fetchThreadsList(accessToken, query, pageToken);
      
      if (currentFetchId !== fetchIdRef.current) return;

      setNextPageToken(listData.nextPageToken || null);

      if (!listData.threads) {
        if (!pageToken) setEmails([]);
        return;
      }

      // Fetch details for each thread
      const emailPromises = listData.threads.map((thread: { id: string }) => 
        fetchThreadDetails(accessToken, thread.id)
      );
      const fetchedEmails = await Promise.all(emailPromises);
      
      if (currentFetchId !== fetchIdRef.current) return;
      
      if (pageToken) {
        setEmails(prev => [...prev, ...fetchedEmails]);
      } else {
        setEmails(fetchedEmails);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // If token is invalid, clear it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).status === 401 || (error as any).message?.includes('401')) {
        localStorage.removeItem('gmail_token');
        setAccessToken(null);
        setUser(null);
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const fetchUserInfo = async () => {
      try {
        const userData = await fetchUserInfoService(accessToken);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
    refreshEmails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, currentFolder]);

  const handleSendEmail = async (
    to: string, 
    subject: string, 
    body: string, 
    replyContext?: { threadId?: string, inReplyTo?: string, references?: string }
  ) => {
    if (!accessToken) return;

    const inReplyTo = replyContext?.inReplyTo || composeInReplyTo;
    const references = replyContext?.references || composeReferences;
    const threadId = replyContext?.threadId || composeThreadId;

    try {
      await sendEmailMessage(accessToken, to, subject, body, threadId, inReplyTo, references);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  const handleInlineReply = async (body: string) => {
    if (!selectedEmail) return;
    
    const lastMessage = selectedEmail.messages[selectedEmail.messages.length - 1];
    const to = lastMessage.sender.email;
    const subject = selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
    
    const replyContext = {
      threadId: selectedEmail.threadId,
      inReplyTo: lastMessage.messageIdHeader,
      references: lastMessage.references ? `${lastMessage.references} ${lastMessage.messageIdHeader}` : lastMessage.messageIdHeader
    };

    await handleSendEmail(to, subject, body, replyContext);
    refreshEmails();
  };

  const handleComposeOpen = () => {
    setComposeInitialTo('');
    setComposeInitialSubject('');
    setComposeThreadId(undefined);
    setComposeInReplyTo(undefined);
    setComposeReferences(undefined);
    setIsComposeOpen(true);
  };

  const fetchAttachment = async (messageId: string, attachmentId: string) => {
    if (!accessToken) return null;
    return fetchAttachmentData(accessToken, messageId, attachmentId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setNextPageToken(null);
    refreshEmails(undefined, query);
  };

  if (!accessToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#191919] font-sans antialiased transition-colors duration-200">
      <Sidebar 
        currentFolder={currentFolder} 
        onFolderChange={(folder) => {
          setCurrentFolder(folder);
          setSearchQuery('');
        }}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-[#E9E9E7] dark:border-[#2F2F2F] flex items-center justify-between px-6 bg-white dark:bg-[#191919]">
          <div className="w-96">
            <SearchInput 
              value={searchQuery} 
              onChange={handleSearch} 
              placeholder="Search emails..."
            />
          </div>
          <Button onClick={handleComposeOpen} icon={Plus}>
            New Message
          </Button>
        </div>

        <div className="flex-1 flex min-h-0">
          <EmailList 
            emails={filteredEmails} 
            selectedEmailId={selectedEmailId}
            onSelectEmail={setSelectedEmailId}
            onRefresh={() => refreshEmails()}
            isRefreshing={isRefreshing}
            onLoadMore={() => nextPageToken && refreshEmails(nextPageToken)}
            hasMore={!!nextPageToken}
            currentUser={user}
            searchQuery={searchQuery}
            currentFolder={currentFolder}
          />
          <EmailView 
            email={selectedEmail} 
            onSendReply={handleInlineReply}
            currentUserEmail={user?.email}
            onFetchAttachment={fetchAttachment}
            onClose={() => setSelectedEmailId(null)}
          />
        </div>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        initialTo={composeInitialTo}
        initialSubject={composeInitialSubject}
      />
    </div>
  );
}

export default App;
