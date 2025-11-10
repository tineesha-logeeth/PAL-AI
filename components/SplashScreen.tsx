import React from 'react';
import { motion } from 'framer-motion';
import InteractiveBotIcon from './InteractiveBotIcon';

const SplashScreen: React.FC = () => {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-main)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
        className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-5 rounded-3xl mb-4 shadow-2xl shadow-[var(--shadow-color)]"
      >
        <InteractiveBotIcon state="idle" className="w-20 h-20 text-[var(--accent-color-1)]" />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.5 }}
        className="text-5xl font-bold tracking-tight text-[var(--accent-color-1)]"
      >
        PAL AI
      </motion.h1>
    </motion.div>
  );
};

export default SplashScreen;
