import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { UserCredentials } from '../types';
import InteractiveBotIcon from './InteractiveBotIcon';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onAuthSuccess: (credentials: UserCredentials, mode: AuthMode) => boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onAuthSuccess }) => {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (currentMode === 'signup' && !name) {
        setError('Please enter your name.');
        return;
    }
    const success = onAuthSuccess({ email, password, name }, currentMode);
    if (!success) {
        setError("Invalid credentials. Please try again.");
    }
  };

  const toggleMode = () => {
    setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
    setError(null);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center mb-6">
            <div className="bg-[var(--bg-input)] p-3 rounded-xl mb-3 shadow-lg shadow-[var(--shadow-color)]">
              <InteractiveBotIcon state="idle" className="w-8 h-8 text-[var(--accent-color-1)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{currentMode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>
            <p className="text-[var(--text-secondary)] text-sm">{currentMode === 'login' ? 'Log in to your PAL AI account' : 'Get started with your own AI assistant'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {currentMode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="name">Name</label>
                <input 
                  id="name"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="password">Password</label>
              <input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-[var(--bg-input)] border-[var(--border-secondary)] border rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-color-1)] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[var(--bg-button-primary)] text-[var(--text-button-primary)] p-3 rounded-xl font-semibold hover:bg-[var(--bg-button-primary-hover)] transition-all shadow-lg hover:shadow-[var(--shadow-color-accent)]"
            >
              {currentMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            {currentMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button onClick={toggleMode} className="font-semibold text-[var(--accent-color-1)] hover:underline ml-1">
              {currentMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
