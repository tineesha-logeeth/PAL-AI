import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Save, Key, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const { apiKey, setApiKey, clearApiKey, apiKeyError } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    setApiKey(inputValue);
    setSaveMessage('API Key saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
    setSaveMessage('API Key cleared.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Settings</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl shadow-[var(--shadow-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Gemini API Key</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
            Your API key is stored securely in your browser's local storage. You'll need to create a key and paste it here to use PAL AI.
          </p>

          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full mb-4 bg-[var(--accent-color-1)] text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--accent-color-1-hover)] transition-all">
            Get Your Gemini API Key
          </a>
          <p className="text-xs text-center text-[var(--text-secondary)] mb-4 -mt-2">This will open Google AI Studio in a new tab. Copy the key and paste it below.</p>

          {apiKeyError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
              {apiKeyError}
            </motion.div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type={isKeyVisible ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-3 pl-10 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
              />
              <button
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label={isKeyVisible ? 'Hide API key' : 'Show API key'}
              >
                {isKeyVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={!inputValue || inputValue === apiKey}
              className="flex items-center gap-2 bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-button-primary-hover)] transition-all font-semibold"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleClear}
              disabled={!apiKey}
              className="flex items-center gap-2 bg-red-500 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-all font-semibold"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          {saveMessage && <p className="text-sm text-[var(--accent-text)] mt-2">{saveMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default Settings;