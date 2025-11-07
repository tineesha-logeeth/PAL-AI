import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Source } from '../types';
import { sendMessageStream, sendMessageWithSearch } from '../services/geminiService';
import { Send, Search, Bot, User, Link as LinkIcon, Loader2, Sparkles, Edit3, Code, BrainCircuit, Globe, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import AutoCorrectingTextarea from './AutoCorrectingTextarea';

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
              <Bot className="w-12 h-12 text-[var(--accent-color-1)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Hello, I'm PAL</h1>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md">Your friendly AI assistant. Ask me anything, or try one of the suggestions below to get started.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
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


const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => document.getElementById('send-button')?.click(), 0);
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;

    const userMessage: ChatMessage = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (useSearch) {
        const response = await sendMessageWithSearch(currentInput);
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter(chunk => chunk.web)
            .map(chunk => ({ uri: chunk.web.uri, title: chunk.web.title })) as Source[];
        const modelMessage: ChatMessage = { role: 'model', content: response.text, sources: sources };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        const stream = await sendMessageStream(currentInput);
        setMessages(prev => [...prev, { role: 'model', content: '' }]);
        for await (const chunk of stream) {
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content += chunk.text;
                return newMessages;
            });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
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
  
  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {showWelcome ? (
            <WelcomeScreen onPromptClick={handlePromptClick} />
        ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && <div className="w-8 h-8 bg-[var(--accent-color-1)] rounded-full flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>}
                    <div className={`max-w-[85%] md:max-w-xl p-3 px-4 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-[var(--bg-user-message)] text-[var(--text-user-message)] rounded-br-none' : 'bg-[var(--bg-model-message)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-bl-none'}`}>
                      <div className="prose prose-sm text-[var(--prose-color)] break-words" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
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
                        <div className="w-8 h-8 bg-[var(--accent-color-1)] rounded-full flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
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
        <div className="max-w-3xl mx-auto bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-2 shadow-2xl shadow-[var(--shadow-color)] flex items-center gap-2">
          <button 
            onClick={() => setUseSearch(prev => !prev)}
            title="Toggle Google Search Grounding"
            className={`p-2 rounded-full transition-colors ${useSearch ? 'bg-[var(--accent-color-1)]/20 text-[var(--accent-color-1)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
            <Search className="w-5 h-5" />
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
            disabled={isLoading || !input.trim()}
            className="self-end bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-button-primary-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
