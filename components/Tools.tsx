import React from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AutoCorrectingTextarea from './AutoCorrectingTextarea';
import { ToolsState, Task, Model } from '../types';

interface ToolsProps {
  state: ToolsState;
  setState: React.Dispatch<React.SetStateAction<ToolsState>>;
  onPerformTask: () => void;
}

const modelInfo: Record<Model, string> = {
    'gemini-2.5-pro': "Best for complex tasks like summarization and in-depth analysis.",
    'gemini-2.5-flash': "Ideal for fast tasks like proofreading and simple rephrasing."
}

const Tools: React.FC<ToolsProps> = ({ state, setState, onPerformTask }) => {
  const { inputText, outputText, isLoading, selectedTask, selectedModel } = state;

  const setInputText = (newText: string) => {
    setState(prev => ({ ...prev, inputText: newText }));
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 flex flex-col flex-1 gap-4 shadow-2xl shadow-[var(--shadow-color)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select a Task</label>
            <select
              id="task-select"
              value={selectedTask}
              onChange={(e) => setState(prev => ({...prev, selectedTask: e.target.value as Task}))}
              className="w-full bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
            >
              <option value="summarize">Summarize</option>
              <option value="proofread">Proofread</option>
              <option value="rephrase">Rephrase</option>
            </select>
          </div>
          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select a Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setState(prev => ({...prev, selectedModel: e.target.value as Model}))}
              className="w-full bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-2.5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
            >
              <option value="gemini-2.5-pro">Pro</option>
              <option value="gemini-2.5-flash">Flash</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-center text-[var(--text-secondary)] -mt-2">{modelInfo[selectedModel]}</p>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[300px] md:min-h-0">
          <AutoCorrectingTextarea
            value={inputText}
            setValue={setInputText}
            placeholder="Paste your text here..."
            className="w-full h-full bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none transition-all resize-none placeholder:text-[var(--text-secondary)]"
            containerClassName="w-full h-full min-h-[200px] md:min-h-0"
            disabled={isLoading}
          />
          <div className="w-full h-full bg-[var(--bg-main)] border-[var(--border-secondary)] border rounded-xl p-3 overflow-y-auto relative min-h-[200px] md:min-h-0">
             {isLoading && (
                 <div className="absolute inset-0 bg-[var(--bg-main)]/80 flex justify-center items-center z-10">
                     <Loader2 className="w-8 h-8 text-[var(--accent-color-1)] animate-spin" />
                 </div>
             )}
            <motion.div 
                key={outputText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-sm text-[var(--prose-color)] whitespace-pre-wrap"
            >
              {outputText || <span className="text-[var(--text-secondary)]">Output will appear here...</span>}
            </motion.div>
          </div>
        </div>
        <button
          onClick={onPerformTask}
          disabled={isLoading || !inputText.trim()}
          className="w-full md:w-1/2 mx-auto flex items-center justify-center gap-2 bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-button-primary-hover)] transition-all font-semibold shadow-lg hover:shadow-[var(--shadow-color-accent)]"
        >
          <Wand2 className="w-5 h-5"/>
          Process Text
        </button>
      </div>
    </div>
  );
};

export default Tools;
