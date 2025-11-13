import React from 'react';
import { marked } from 'marked';
import { Loader2, Wand2, AlertTriangle, Settings, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import AutoCorrectingTextarea from './AutoCorrectingTextarea';
import { ToolsState, Task, Model } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ToolsProps {
  state: ToolsState;
  setState: React.Dispatch<React.SetStateAction<ToolsState>>;
  onPerformTask: (state: ToolsState) => void;
  setActiveTab: (tab: 'chat' | 'image' | 'tools' | 'history' | 'settings') => void;
}

const modelInfo: Record<Model, string> = {
    'gemini-2.5-pro': "Best for complex tasks like summarization and in-depth analysis.",
    'gemini-2.5-flash': "Ideal for fast tasks like proofreading and simple rephrasing."
}

const ApiKeyWarning = ({ setActiveTab, error }: { setActiveTab: ToolsProps['setActiveTab'], error?: string | null }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-2xl p-8 shadow-2xl shadow-amber-500/10 flex flex-col items-center gap-4">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">API Key Required</h2>
            <p className="text-[var(--text-secondary)] max-w-sm">
                {error || "To use PAL Tools, you'll need a Gemini API key. Get one from Google AI Studio and add it in the settings."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-all"
                >
                    <Key className="w-5 h-5" />
                    Get API Key
                </a>
                <button
                    onClick={() => setActiveTab('settings')}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-all"
                >
                    <Settings className="w-5 h-5" />
                    Go to Settings
                </button>
            </div>
        </div>
    </div>
);

const Tools: React.FC<ToolsProps> = ({ state, setState, onPerformTask, setActiveTab }) => {
  const { inputText, outputText, isLoading, selectedTask, selectedModel } = state;
  const { isKeySet, apiKeyError, setApiKeyError } = useApiKey();

  const setInputText = (newText: string) => {
    setState(prev => ({ ...prev, inputText: newText }));
  };

  const handlePerformTask = async () => {
    setApiKeyError(null);
    try {
        await onPerformTask(state);
    } catch (err) {
        if (err instanceof Error && err.message.toLowerCase().includes('api key')) {
            setApiKeyError('Your API key appears to be invalid. Please check it in Settings.');
        }
    }
  };
  
  if (!isKeySet || apiKeyError) {
    return <ApiKeyWarning setActiveTab={setActiveTab} error={apiKeyError} />;
  }

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
                className="prose prose-sm text-[var(--prose-text-color)]"
                dangerouslySetInnerHTML={outputText ? { __html: marked.parse(outputText) as string } : undefined}
            >
              {!outputText && <span className="text-[var(--text-secondary)]">Output will appear here...</span>}
            </motion.div>
          </div>
        </div>
        <button
          onClick={handlePerformTask}
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