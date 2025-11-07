import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import ImageGenerator from './components/ImageGenerator';
import Tools from './components/Tools';
import History from './components/History';
import FloatingParticles from './components/FloatingParticles';
import ThemeSwitcher from './components/ThemeSwitcher';
import AuthModal from './components/AuthModal';
import { useTheme } from './contexts/ThemeContext';
import { User, UserCredentials, ImageGeneratorState, ToolsState } from './types';
import { generateImage, performTask } from './services/geminiService';
import { MessageSquare, Image, Wrench, Bot, Menu, History as HistoryIcon, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'chat' | 'image' | 'tools' | 'history';
type AuthMode = 'login' | 'signup';

const tabConfig = {
  chat: { label: 'PAL Chat', title: 'Ask PAL' },
  image: { label: 'PAL Gen', title: 'PAL Gen' },
  tools: { label: 'PAL Tools', title: 'PAL Tools' },
  history: { label: 'PAL History', title: 'PAL History' },
};

// Mock user storage
let mockUser: User | null = null;

const initialImageGenState: ImageGeneratorState = {
  prompt: '',
  isLoading: false,
  imageUrl: null,
  error: null,
};

const initialToolsState: ToolsState = {
  inputText: '',
  outputText: '',
  isLoading: false,
  selectedTask: 'summarize',
  selectedModel: 'gemini-2.5-pro',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { theme } = useTheme();

  // Lifted state for persistent tasks
  const [imageGenState, setImageGenState] = useState<ImageGeneratorState>(initialImageGenState);
  const [toolsState, setToolsState] = useState<ToolsState>(initialToolsState);

  // Handle sidebar visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageGenerate = async () => {
    if (!imageGenState.prompt.trim() || imageGenState.isLoading) return;
  
    setImageGenState(prev => ({ ...prev, isLoading: true, imageUrl: null, error: null }));
    try {
      const url = await generateImage(imageGenState.prompt);
      setImageGenState(prev => ({ ...prev, imageUrl: url, isLoading: false }));
    } catch (err) {
      console.error('Image generation error:', err);
      setImageGenState(prev => ({ ...prev, error: 'Failed to generate image. Please try again.', isLoading: false }));
    }
  };

  const handlePerformTask = async () => {
    if (!toolsState.inputText.trim() || toolsState.isLoading) return;
  
    setToolsState(prev => ({ ...prev, isLoading: true, outputText: '' }));
    try {
      const taskPrompts: Record<ToolsState['selectedTask'], string> = {
        summarize: "Summarize the following text concisely:",
        proofread: "Proofread the following text for any grammatical errors, spelling mistakes, or typos, and provide the corrected version:",
        rephrase: "Rephrase the following text to make it more clear, engaging, and professional:",
      };
      const prompt = `${taskPrompts[toolsState.selectedTask]}\n\n---\n\n${toolsState.inputText}`;
      const result = await performTask(prompt, toolsState.selectedModel);
      setToolsState(prev => ({ ...prev, outputText: result, isLoading: false }));
    } catch (error) {
      console.error('Error performing task:', error);
      setToolsState(prev => ({ ...prev, outputText: 'An error occurred. Please try again.', isLoading: false }));
    }
  };

  const handleOpenAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    mockUser = null;
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleAuthSuccess = (credentials: UserCredentials, mode: AuthMode): boolean => {
    const user: User = { 
        name: mode === 'signup' ? credentials.name! : (mockUser?.name || 'User'), 
        email: credentials.email 
    };
    
    if (mode === 'signup') {
        mockUser = user;
        setCurrentUser(user);
        setIsAuthModalOpen(false);
        return true;
    }
    
    if (mode === 'login' && mockUser && mockUser.email === credentials.email && mockUser.password === credentials.password) {
        setCurrentUser(mockUser);
        setIsAuthModalOpen(false);
        return true;
    }

    return false;
  };
  
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <Chat />;
      case 'image':
        return <ImageGenerator state={imageGenState} setState={setImageGenState} onGenerate={handleImageGenerate} />;
      case 'tools':
        return <Tools state={toolsState} setState={setToolsState} onPerformTask={handlePerformTask} />;
      case 'history':
        return <History />;
      default:
        return <Chat />;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => handleTabChange(tab)}
      className={`flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out w-full justify-start relative text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]`}
    >
      {activeTab === tab && (
        <motion.div
          layoutId="active-nav-indicator"
          className="absolute inset-0 bg-[var(--bg-active-nav)] rounded-lg z-0"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
       {activeTab === tab && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent-color-1)] rounded-r-full z-10" />}
      <Icon className={`w-5 h-5 flex-shrink-0 z-10 ${activeTab === tab ? 'text-[var(--accent-text)]' : ''}`} />
      <span className={`whitespace-nowrap z-10 ${activeTab === tab ? 'text-[var(--text-primary)] font-semibold' : ''}`}>{label}</span>
    </button>
  );

  return (
    <div className={`font-sans antialiased relative h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] ${theme}-theme`}>
      <FloatingParticles />
      <div className="flex h-full relative z-10">
        
        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
            {isSidebarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/30 z-30 md:hidden"
                />
            )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-[var(--bg-sidebar-header)] border-r border-[var(--border-primary)] transition-transform duration-300 ease-in-out w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="flex items-center p-4 border-b border-[var(--border-primary)] h-16 flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-[var(--bg-input)]' : ''}`}>
                <Bot className={`w-6 h-6 text-[var(--accent-color-1)]`} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">PAL AI</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem tab="chat" icon={MessageSquare} label={tabConfig.chat.label} />
            <NavItem tab="image" icon={Image} label={tabConfig.image.label} />
            <NavItem tab="tools" icon={Wrench} label={tabConfig.tools.label} />
            <NavItem tab="history" icon={HistoryIcon} label={tabConfig.history.label} />
          </nav>
           {/* Mobile Auth Section */}
           <div className="md:hidden p-4 border-t border-[var(--border-primary)]">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{currentUser.name}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors" aria-label="Log Out">
                    <LogOut className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => handleOpenAuthModal('login')} className="w-full text-sm font-medium text-center text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-secondary)]">Log In</button>
                  <button onClick={() => handleOpenAuthModal('signup')} className="w-full text-sm font-medium text-center bg-[var(--text-primary)] text-[var(--bg-main)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Sign Up</button>
                </div>
              )}
          </div>
        </aside>

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-0`}>
            <header className="flex-shrink-0 flex items-center justify-between p-4 h-16 bg-[var(--bg-sidebar-header)] border-b border-[var(--border-primary)]">
                <div className="flex items-center">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] mr-2 md:mr-4 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-6 h-6 text-[var(--text-secondary)]" />
                    </button>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{tabConfig[activeTab].title}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeSwitcher />
                    {currentUser ? (
                         <div className="hidden md:flex items-center gap-3">
                            <span className="text-sm font-medium text-[var(--text-secondary)] hidden sm:block">Welcome, {currentUser.name}!</span>
                            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors" aria-label="Log Out">
                                <LogOut className="w-5 h-5 text-[var(--text-secondary)]" />
                            </button>
                         </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <button onClick={() => handleOpenAuthModal('login')} className="text-sm font-medium text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">Log In</button>
                            <button onClick={() => handleOpenAuthModal('signup')} className="text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-main)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Sign Up</button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full w-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
        </div>
      </div>
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            mode={authMode} 
            onClose={() => setIsAuthModalOpen(false)} 
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;