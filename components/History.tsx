import React from 'react';
import { MessageSquarePlus, Trash2, History as HistoryIcon } from 'lucide-react';
import { Conversation } from '../types';
import { motion } from 'framer-motion';

interface HistoryProps {
    history: Conversation[];
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onNewChat: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onSelect, onDelete, onNewChat }) => {
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
                        onClick={onNewChat}
                        className="mt-4 flex items-center justify-center gap-2 w-full bg-[var(--accent-color-1)] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--accent-color-1-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)]"
                    >
                        <MessageSquarePlus className="w-5 h-5" />
                        Start New Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Conversation History</h2>
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-2 text-sm font-medium bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-button-primary-hover)] transition-all"
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
                            className="group flex items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                            onClick={() => onSelect(conv.id)}
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