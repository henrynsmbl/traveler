import React from 'react';
import { Menu, X, MessageSquare, Clock, Trash2, Home, User, CreditCard, Info } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '../auth/UserMenu';
import { AuthButton } from '../auth/AuthButton';
import { useAuth } from '../auth/AuthContext';
import type { ChatSession } from '@/types/chat';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  navItems?: Array<{ 
    label: string; 
    href: string; 
    requireAuth?: boolean;
    icon?: React.ElementType;
  }>;
}

const generateSessionKey = (session: ChatSession, index: number) => {
  return `${session.id}-${session.updatedAt.getTime()}-${index}`;
};

const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sessions,
  currentSessionId,
  onSessionSelect,
  onDeleteSession,
  navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Account', href: '/account', requireAuth: true, icon: User },
    { label: 'Subscription', href: '/subscription', icon: CreditCard },
    { label: 'About', href: '/about', icon: Info }
  ]
}) => {
  const { user } = useAuth();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isSignInPage = pathname === '/signin';

  // Handle clicks outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isSidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const filteredNavItems = navItems.filter(item =>
    !item.requireAuth || (item.requireAuth && user)
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
        <div className="h-full flex items-center justify-between max-w-[100vw] px-4">
          <div className="w-[64px] flex-none">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex-1 flex justify-center items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity duration-200">
              <div className="w-8 h-8 relative flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="aitinerary logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate max-w-[200px]">
                aitinerary
              </h1>
            </Link>
          </div>

          <div className="w-[64px] flex justify-end flex-none z-[60]">
            {user ? <UserMenu /> : (!isSignInPage && <AuthButton />)}
          </div>
        </div>
      </nav>

      <aside 
        ref={sidebarRef}
        className={`fixed top-16 left-0 w-full md:w-64 bottom-0 bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out z-30
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-lg md:shadow-none`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Chat History</h2>
              
              <div className="space-y-2">
                {sessions.map((session, index) => (
                  <div
                    key={generateSessionKey(session, index)}
                    className="group relative"
                  >
                    <div
                      onClick={() => onSessionSelect(session.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors duration-200 cursor-pointer
                        ${currentSessionId === session.id 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    >
                      <div className="flex items-center">
                        <MessageSquare size={16} className="mr-2 opacity-70" />
                        <span className="text-sm font-medium truncate flex-1">
                          {session.title || 'New Chat'}
                        </span>
                      </div>
                      
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} className="mr-1" />
                        <span>{session.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                               text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
                               transition-opacity duration-200"
                      aria-label="Delete chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No chat history yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <nav className="p-4 space-y-1">
              {filteredNavItems.map((item, index) => (
                <Link
                  key={`nav-item-${item.href}-${index}`}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 
                    hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                    group relative overflow-hidden"
                >
                  <div className="flex items-center w-full">
                    {item.icon && (
                      <item.icon 
                        size={20} 
                        className="mr-3 text-gray-500 dark:text-gray-400
                          group-hover:text-blue-500 dark:group-hover:text-blue-400
                          transition-colors duration-200"
                      />
                    )}
                    <span className="font-medium group-hover:text-blue-600 
                      dark:group-hover:text-blue-400 transition-colors duration-200">
                      {item.label}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 scale-y-0 
                    group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;