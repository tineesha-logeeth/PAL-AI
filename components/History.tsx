import React from 'react';
import { History as HistoryIcon } from 'lucide-react';

const History: React.FC = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-4 md:p-6 text-center">
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-10 shadow-2xl shadow-[var(--shadow-color)] flex flex-col items-center gap-4">
            <HistoryIcon className="w-16 h-16 text-[var(--accent-color-1)]" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Coming Soon!</h2>
            <p className="text-[var(--text-secondary)] max-w-xs">
                We're working on a feature to save and view your chat history. Check back later!
            </p>
        </div>
    </div>
  );
};

export default History;