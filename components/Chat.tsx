import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { marked } from 'marked';
import type { ChatMessage, Source } from '../types';
import { sendMessageStream } from '../services/geminiService';
import { Send, Search, User, Link as LinkIcon, Loader2, Sparkles, Edit3, Code, BrainCircuit, Globe, Film, Paperclip, X, UploadCloud, Dumbbell, Feather, Mail, Users, FileQuestion, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AutoCorrectingTextarea from './AutoCorrectingTextarea';
import InteractiveBotIcon from './InteractiveBotIcon';

const LoadingSpinner = () => (
    <div className="flex items-center gap-2">
      <Loader2 className="w-5 h-5 text-[var(--accent-color-1)] animate-spin" />
      <span className="text-[var(--text-secondary)]">PAL is thinking...</span>
    </div>
);

const SourceDisplay = ({ sources }: { sources: Source[] }) => (
    <div className="mt-3 pt-3 border-t border-[var(--accent-color-1)]/20">
        <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-2">Sources:</h4>
        <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
                <a
                    key={index}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[var(--accent-color-1)]/10 hover:bg-[var(--accent-color-1)]/20 text-[var(--accent-text)] text-xs px-2 py-1 rounded-full transition-colors"
                >
                    <LinkIcon size={12} />
                    <span>{source.title || new URL(source.uri).hostname}</span>
                </a>
            ))}
        </div>
    </div>
);

const allPrompts = [
    { icon: Sparkles, text: "Give me ideas for a 10-day trip to Japan" },
    { icon: Edit3, text: "Write a short story in the style of a classic fairytale" },
    { icon: Code, text: "Explain quantum computing in simple terms" },
    { icon: BrainCircuit, text: "Brainstorm three names for a new coffee brand" },
    { icon: Globe, text: "What are the pros and cons of renewable energy sources?" },
    { icon: Film, text: "Suggest a movie to watch if I like mind-bending sci-fi" },
    { icon: Dumbbell, text: "Create a workout plan for a beginner focused on full-body strength" },
    { icon: Feather, text: "Compose a short poem about the city at night" },
    { icon: Mail, text: "Help me draft a professional email to decline a job offer politely" },
    { icon: FileQuestion, text: "What's a healthy and easy recipe for a weeknight dinner?" },
    { icon: Globe, text: "Act as a travel guide and describe the top 3 attractions in Rome" },
    { icon: Edit3, text: "Generate a list of 5 creative blog post ideas for a tech blog" },
    { icon: BrainCircuit, text: "Explain the concept of blockchain technology like I'm five" },
    { icon: MessageCircle, text: "Write a dialogue between a robot and a philosopher about life" },
    { icon: Users, text: "How can I improve my public speaking skills? Give me three actionable tips" },
];

const WelcomeScreen = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => {
    
    const [prompts, setPrompts] = useState<{icon: React.ElementType; text: string}[]>([]);

    useEffect(() => {
        const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
        setPrompts(shuffled.slice(0, 3));
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-[var(--bg-input)] p-4 rounded-2xl mb-4 shadow-lg shadow-[var(--shadow-color)]">
              <InteractiveBotIcon className="w-12 h-12 text-[var(--accent-color-1)]" state="idle" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Hello, I'm PAL</h1>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md">Your friendly AI assistant. Ask me anything, or try one of the suggestions below to get started.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl">
                {prompts.map((p, i) => (
                    <motion.button 
                        key={i} 
                        onClick={() => onPromptClick(p.text)} 
                        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 text-left hover:bg-[var(--bg-hover)] transition-all h-full"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <p.icon className="w-6 h-6 text-[var(--accent-color-1)] mb-2" />
                        <p className="font-medium text-[var(--text-primary)] text-sm">{p.text}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

interface ChatProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [attachment, setAttachment] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // This function handles the logic of whether to scroll and how.
    const handleScroll = (behavior: 'smooth' | 'auto') => {
      // A generous threshold to decide if the user is "at the bottom"
      const scrollThreshold = 250; 
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <= scrollThreshold;

      // Only scroll if the user is already near the bottom
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }
    };

    // For new messages, use a smooth scroll.
    handleScroll('smooth');

    // For resizes (like mobile keyboard opening), use an instant scroll.
    const resizeObserver = new ResizeObserver(() => handleScroll('auto'));
    resizeObserver.observe(scrollContainer);

    // Cleanup on unmount or when messages change.
    return () => resizeObserver.disconnect();
  }, [messages]);
  
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => document.getElementById('send-button')?.click(), 0);
  }
  
  const processFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            setAttachment({
                data: base64Data,
                mimeType: file.type,
                previewUrl: result,
            });
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
    // Reset file input value to allow selecting the same file again
    if(event.target) event.target.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    const currentInput = input;
    const currentAttachment = attachment;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: currentInput,
      attachment: currentAttachment ? {
        data: currentAttachment.data,
        mimeType: currentAttachment.mimeType,
        previewUrl: currentAttachment.previewUrl
      } : undefined
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
        const stream = await sendMessageStream(
            messages, // Pass previous messages for context
            currentInput, 
            currentAttachment ? { data: currentAttachment.data, mimeType: currentAttachment.mimeType } : undefined,
            useSearch
        );

        let currentChat: ChatMessage[] = [...newMessages, { role: 'model', content: '', sources: [] }];
        setMessages(currentChat);

        for await (const chunk of stream) {
            let modelMessage = { ...currentChat[currentChat.length - 1] };
            
            // Append text
            modelMessage.content += chunk.text;
            
            // Check for and append sources
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                const newSources = groundingChunks
                    .filter(c => c.web)
                    .map(c => ({ uri: c.web.uri, title: c.web.title })) as Source[];
                
                const existingSources = modelMessage.sources || [];
                const combinedSources = [...existingSources];
                newSources.forEach(ns => {
                    if (ns.uri && !existingSources.some(es => es.uri === ns.uri)) {
                        combinedSources.push(ns);
                    }
                });
                modelMessage.sources = combinedSources;
            }

            currentChat = currentChat.map((msg, i) => i === currentChat.length - 1 ? modelMessage : msg);
            setMessages(currentChat);
        }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };
  
  const showWelcome = messages.length === 0;

  return (
    <div 
        className="flex flex-col h-full relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--bg-main)]/80 flex flex-col justify-center items-center z-20 m-4 border-4 border-dashed border-[var(--accent-color-1)] rounded-2xl"
            >
                <UploadCloud className="w-16 h-16 text-[var(--accent-color-1)]" />
                <p className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Drop image to attach</p>
            </motion.div>
        )}
      </AnimatePresence>
      <div ref={scrollContainerRef} className="flex-1 p-4 md:p-6 overflow-y-auto">
        {showWelcome ? (
            <WelcomeScreen onPromptClick={handlePromptClick} />
        ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && <div className="w-8 h-8 bg-[var(--accent-color-1)] rounded-full flex-shrink-0 flex items-center justify-center"><InteractiveBotIcon className="w-5 h-5 text-white" state="idle" /></div>}
                    <div className={`max-w-[85%] md:max-w-xl p-3 px-4 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-[var(--bg-user-message)] text-[var(--text-user-message)] rounded-br-none' : 'bg-[var(--bg-model-message)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-bl-none'}`}>
                      {msg.role === 'user' && msg.attachment && (
                         <img src={msg.attachment.previewUrl} alt="User attachment" className="mb-2 rounded-lg max-w-full h-auto max-h-64 object-contain" />
                      )}
                      {msg.content && <div className="prose prose-sm text-[var(--prose-text-color)] break-words" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} />}
                      {msg.sources && msg.sources.length > 0 && <SourceDisplay sources={msg.sources} />}
                    </div>
                    {msg.role === 'user' && <div className="w-8 h-8 bg-[var(--bg-input)] rounded-full flex-shrink-0 flex items-center justify-center"><User className="w-5 h-5 text-[var(--text-secondary)]" /></div>}
                  </motion.div>
                ))}
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                    >
                        <div className="w-8 h-8 bg-[var(--accent-color-1)] rounded-full flex-shrink-0 flex items-center justify-center"><InteractiveBotIcon className="w-5 h-5 text-white" state="thinking" /></div>
                        <div className="max-w-xl p-3 px-4 rounded-2xl bg-[var(--bg-model-message)] border border-[var(--border-secondary)] rounded-bl-none">
                           <LoadingSpinner />
                        </div>
                    </motion.div>
                )}
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 md:p-6 bg-transparent">
        <div className="max-w-6xl mx-auto">
            <AnimatePresence>
            {attachment && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-2 flex items-center gap-2 overflow-hidden"
                >
                    <img src={attachment.previewUrl} alt="Attachment preview" className="w-12 h-12 object-cover rounded-md" />
                    <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">Image attached</span>
                    <button onClick={() => setAttachment(null)} className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
            </AnimatePresence>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl shadow-[var(--shadow-color)] flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <button 
                onClick={() => setUseSearch(prev => !prev)}
                title="Toggle Google Search Grounding"
                className={`p-2 rounded-full transition-colors ${useSearch ? 'bg-[var(--accent-color-1)]/20 text-[var(--accent-color-1)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                <Search className="w-5 h-5" />
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <AutoCorrectingTextarea
                    value={input}
                    setValue={setInput}
                    onKeyPress={handleKeyPress}
                    placeholder={useSearch ? "Ask with Google Search..." : "Ask PAL anything..."}
                    className="w-full bg-transparent p-2 text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)] resize-none"
                    disabled={isLoading}
                    rows={1}
                />
            </div>
            <button
                id="send-button"
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachment)}
                className="self-end bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-button-primary-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)]"
            >
                <Send className="w-5 h-5" />
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
