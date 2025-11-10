import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import ImageGenerator from './components/ImageGenerator';
import Tools from './components/Tools';
import History from './components/History';
import FloatingParticles from './components/FloatingParticles';
import ThemeSwitcher from './components/ThemeSwitcher';
import AuthModal from './components/AuthModal';
import SplashScreen from './components/SplashScreen'; // Import SplashScreen
import InteractiveBotIcon from './components/InteractiveBotIcon';
import { useTheme } from './contexts/ThemeContext';
import { User, UserCredentials, ImageGeneratorState, ToolsState, Conversation, ChatMessage } from './types';
import { generateImage, performTask, describeImage } from './services/geminiService';
import { MessageSquare, Image, Wrench, Menu, History as HistoryIcon, LogOut, User as UserIcon, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'chat' | 'image' | 'tools' | 'history';
type AuthMode = 'login' | 'signup';

const tabConfig = {
  chat: { label: 'PAL Chat', title: 'Ask PAL' },
  image: { label: 'PAL Gen', title: 'PAL Gen' },
  tools: { label: 'PAL Tools', title: 'PAL Tools' },
  history: { label: 'PAL History', title: 'PAL History' },
};

// Mock user storage that will be hydrated from localStorage
let mockUser: User | null = null;

const initialImageGenState: ImageGeneratorState = {
  prompt: '',
  isLoading: false,
  generatedImageUrl: null,
  generatedDescription: null,
  error: null,
  mode: 'create',
  uploadedImage: null,
};

const initialToolsState: ToolsState = {
  inputText: '',
  outputText: '',
  isLoading: false,
  selectedTask: 'summarize',
  selectedModel: 'gemini-2.5-pro',
};

const getInitialState = <T extends { isLoading?: boolean }>(key: string, initialState: T): T => {
    try {
        const savedState = localStorage.getItem(key);
        if (savedState) {
            const parsedState = JSON.parse(savedState) as T;
            // Always reset loading state on refresh to avoid being stuck.
            if (parsedState.isLoading !== undefined) {
                parsedState.isLoading = false;
            }
            return parsedState;
        }
    } catch (error) {
        console.error(`Failed to load state for ${key} from localStorage`, error);
    }
    return initialState;
};

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true); // State for splash screen
  const [activeTab, setActiveTab] = useState<Tab>(() => (localStorage.getItem('pal-ai-activeTab') as Tab) || 'chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { theme } = useTheme();

  // Lifted state for persistent tasks
  const [imageGenState, setImageGenState] = useState<ImageGeneratorState>(() => getInitialState('pal-ai-imageGenState', initialImageGenState));
  const [toolsState, setToolsState] = useState<ToolsState>(() => getInitialState('pal-ai-toolsState', initialToolsState));

  // State for chat history and current conversation
  const [history, setHistory] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Effect for splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2500); // Show splash screen for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);
  
  // Load all persisted state from localStorage on mount
  useEffect(() => {
    try {
      // User
      const savedUser = localStorage.getItem('pal-ai-user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        mockUser = parsedUser;
        setCurrentUser(parsedUser);
      }
      
      // History and Current Conversation
      const savedHistory = localStorage.getItem('pal-ai-history');
      const loadedHistory = savedHistory ? JSON.parse(savedHistory) : [];
      setHistory(loadedHistory);
      
      const savedConversationId = localStorage.getItem('pal-ai-currentConversationId');
      if (savedConversationId) {
          const currentConv = loadedHistory.find((c: Conversation) => c.id === savedConversationId);
          if (currentConv) {
              setCurrentConversationId(currentConv.id);
              setCurrentMessages(currentConv.messages);
          } else {
              localStorage.removeItem('pal-ai-currentConversationId'); // Clean up orphan ID
          }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      mockUser = null;
      setHistory([]);
    }
  }, []);

  // --- Start of State Persistence Effects ---
  
  // Save active tab
  useEffect(() => {
    localStorage.setItem('pal-ai-activeTab', activeTab);
  }, [activeTab]);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem('pal-ai-history', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  // Save current conversation ID
  useEffect(() => {
    if (currentConversationId) {
        localStorage.setItem('pal-ai-currentConversationId', currentConversationId);
    } else {
        localStorage.removeItem('pal-ai-currentConversationId');
    }
  }, [currentConversationId]);

  // Save Image Generator state
  useEffect(() => {
    localStorage.setItem('pal-ai-imageGenState', JSON.stringify(imageGenState));
  }, [imageGenState]);

  // Save Tools state
  useEffect(() => {
    localStorage.setItem('pal-ai-toolsState', JSON.stringify(toolsState));
  }, [toolsState]);

  // --- End of State Persistence Effects ---

  const handleUpdateMessages = (newMessages: ChatMessage[]) => {
    // If it's a new conversation (no ID yet)
    if (!currentConversationId && newMessages.length > 0) {
        const newId = Date.now().toString();
        setCurrentConversationId(newId); // Set ID for subsequent updates

        const newConversation: Conversation = {
            id: newId,
            title: newMessages[0].content.substring(0, 40) + (newMessages[0].content.length > 40 ? '...' : ''),
            messages: newMessages,
            timestamp: Date.now(),
        };
        
        setHistory(prev => [newConversation, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    } 
    // If it's an existing conversation
    else if (currentConversationId) {
        setHistory(prev => 
            prev.map(conv => 
                conv.id === currentConversationId 
                    ? { ...conv, messages: newMessages, timestamp: Date.now() } 
                    : conv
            ).sort((a, b) => b.timestamp - a.timestamp)
        );
    }
    
    setCurrentMessages(newMessages);
  };

  const handleNewChat = () => {
    setCurrentMessages([]);
    setCurrentConversationId(null);
    setActiveTab('chat');
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    const conversation = history.find(c => c.id === id);
    if (conversation) {
        setCurrentConversationId(conversation.id);
        setCurrentMessages(conversation.messages);
        setActiveTab('chat');
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    }
  };

  const handleDeleteConversation = (id: string) => {
    setHistory(prev => prev.filter(c => c.id !== id));
    if (id === currentConversationId) {
        handleNewChat();
    }
  };


  const handleImageGenerate = async (currentState: ImageGeneratorState) => {
    if (!currentState.prompt.trim() || currentState.isLoading) return;
  
    setImageGenState(prev => ({ ...prev, isLoading: true, generatedImageUrl: null, error: null }));
    try {
      const url = await generateImage(currentState.prompt);
      setImageGenState(prev => ({ ...prev, generatedImageUrl: url, isLoading: false }));
    } catch (err) {
      console.error('Image generation error:', err);
      setImageGenState(prev => ({ ...prev, error: 'Failed to generate image. Please try again.', isLoading: false }));
    }
  };

  const handleImageDescribe = async (currentState: ImageGeneratorState) => {
    if (!currentState.uploadedImage || currentState.isLoading) return;
  
    setImageGenState(prev => ({ ...prev, isLoading: true, generatedDescription: null, error: null }));
    try {
      const description = await describeImage({
        data: currentState.uploadedImage.data,
        mimeType: currentState.uploadedImage.mimeType,
      });
      setImageGenState(prev => ({ ...prev, generatedDescription: description, isLoading: false }));
    } catch (err) {
      console.error('Image description error:', err);
      setImageGenState(prev => ({ ...prev, error: 'Failed to describe image. Please try again.', isLoading: false }));
    }
  };

  const handlePerformTask = async (currentState: ToolsState) => {
    if (!currentState.inputText.trim() || currentState.isLoading) return;
  
    setToolsState(prev => ({ ...prev, isLoading: true, outputText: '' }));
    try {
      const taskPrompts: Record<ToolsState['selectedTask'], string> = {
        summarize: "Summarize the following text concisely:",
        proofread: "Proofread the following text for any grammatical errors, spelling mistakes, or typos, and provide the corrected version:",
        rephrase: "Rephrase the following text to make it more clear, engaging, and professional:",
      };
      const prompt = `${taskPrompts[currentState.selectedTask]}\n\n---\n\n${currentState.inputText}`;
      const result = await performTask(prompt, currentState.selectedModel);
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
    try {
      localStorage.removeItem('pal-ai-user');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleAuthSuccess = (credentials: UserCredentials, mode: AuthMode): boolean => {
    if (mode === 'signup') {
        const newUser: User = {
            name: credentials.name!,
            email: credentials.email,
            password: credentials.password
        };
        mockUser = newUser;
        try {
            localStorage.setItem('pal-ai-user', JSON.stringify(mockUser));
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
        setCurrentUser(newUser);
        setIsAuthModalOpen(false);
        return true;
    }

    if (mode === 'login') {
        if (mockUser && mockUser.email === credentials.email && mockUser.password === credentials.password) {
            setCurrentUser(mockUser);
            setIsAuthModalOpen(false);
            return true;
        }
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
        return <Chat messages={currentMessages} setMessages={handleUpdateMessages} />;
      case 'image':
        return <ImageGenerator state={imageGenState} setState={setImageGenState} onGenerate={handleImageGenerate} onDescribe={handleImageDescribe} />;
      case 'tools':
        return <Tools state={toolsState} setState={setToolsState} onPerformTask={handlePerformTask} />;
      case 'history':
        return <History history={history} onSelect={handleSelectConversation} onDelete={handleDeleteConversation} onNewChat={handleNewChat} />;
      default:
        return <Chat messages={currentMessages} setMessages={handleUpdateMessages} />;
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
      <AnimatePresence>
        {isAppLoading ? (
          <SplashScreen />
        ) : (
          <motion.div 
            key="main-app" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
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
              <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--bg-sidebar-header)] border-r border-[var(--border-primary)] transition-transform duration-300 ease-in-out w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center p-4 border-b border-[var(--border-primary)] h-16 flex-shrink-0">
                  <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                    <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-[var(--bg-input)]' : ''}`}>
                      <InteractiveBotIcon state="idle" className="w-6 h-6 text-[var(--accent-color-1)]" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">PAL AI</h1>
                  </div>
                </div>
                <div className="p-4">
                  <button
                      onClick={handleNewChat}
                      className="flex items-center justify-center gap-2 w-full bg-[var(--accent-color-1)] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--accent-color-1-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)]"
                  >
                      <PlusCircle className="w-5 h-5" />
                      New Chat
                  </button>
                </div>
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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
                        <button onClick={() => handleOpenAuthModal('signup')} className="w-full text-sm font-medium text-center bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-button-primary-hover)] transition-colors">Sign Up</button>
                      </div>
                    )}
                </div>
              </aside>

              <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
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
                                  <button onClick={() => handleOpenAuthModal('signup')} className="text-sm font-medium bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-button-primary-hover)] transition-colors">Sign Up</button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
