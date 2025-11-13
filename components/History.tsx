import React from 'react';
import { MessageSquarePlus, Trash2, History as HistoryIcon, AlertTriangle, Settings } from 'lucide-react';
import { Conversation } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiKey } from '../contexts/ApiKeyContext';

interface HistoryProps {
    history: Conversation[];
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onNewChat: () => void;
    setActiveTab: (tab: 'chat' | 'image' | 'tools' | 'history' | 'settings') => void;
}

const ApiKeyWarningMessage = ({ setActiveTab, error }: { setActiveTab: HistoryProps['setActiveTab'], error?: string | null }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-lg text-sm mb-4 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
        <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error || "An API Key is required to start or continue chats. Get a key and add it in settings."}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Get Key</a>
            <span className="text-amber-500/50">|</span>
            <button onClick={() => setActiveTab('settings')} className="font-semibold text-amber-700 dark:text-amber-400 hover:underline transition-colors">Settings</button>
        </div>
    </motion.div>
);

const History: React.FC<HistoryProps> = ({ history, onSelect, onDelete, onNewChat, setActiveTab }) => {
    const { isKeySet, apiKeyError } = useApiKey();

    const handleNewChatClick = () => {
        if (isKeySet && !apiKeyError) {
            onNewChat();
        }
    }

    const handleSelectClick = (id: string) => {
        if (isKeySet && !apiKeyError) {
            onSelect(id);
        }
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-4 md:p-6 text-center">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-10 shadow-2xl shadow-[var(--shadow-color)] flex flex-col items-center gap-4">
                    <HistoryIcon className="w-16 h-16 text-[var(--accent-color-1)]" />
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">No History Yet</h2>
                    <p className="text-[var(--text-secondary)] max-w-xs">
                        Your conversations will be saved here. Start a new chat to begin!
                    </p>
                    <button
                        onClick={handleNewChatClick}
                        disabled={!isKeySet || !!apiKeyError}
                        className="mt-4 flex items-center justify-center gap-2 w-full bg-[var(--accent-color-1)] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--accent-color-1-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageSquarePlus className="w-5 h-5" />
                        Start New Chat
                    </button>
                    <AnimatePresence>
                    {(!isKeySet || apiKeyError) && (
                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-xs text-amber-600 dark:text-amber-500 mt-2 max-w-xs"
                        >
                           Please set your API key in settings to start a chat.
                        </motion.p>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full">
                <AnimatePresence>
                    {(!isKeySet || apiKeyError) && <ApiKeyWarningMessage setActiveTab={setActiveTab} error={apiKeyError} />}
                </AnimatePresence>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Conversation History</h2>
                    <button
                        onClick={handleNewChatClick}
                        disabled={!isKeySet || !!apiKeyError}
                        className="flex items-center gap-2 text-sm font-medium bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-button-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>
                <div className="space-y-3">
                    {history.map(conv => (
                        <motion.div
                            key={conv.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                            className={`group flex items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl transition-colors ${isKeySet && !apiKeyError ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'opacity-70'}`}
                            onClick={() => handleSelectClick(conv.id)}
                            aria-disabled={!isKeySet || !!apiKeyError}
                        >
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="font-semibold text-[var(--text-primary)] truncate">{conv.title}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{new Date(conv.timestamp).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Delete conversation"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default History;