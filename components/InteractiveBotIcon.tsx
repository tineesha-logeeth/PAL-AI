import React from 'react';
import { motion } from 'framer-motion';

type BotState = 'idle' | 'thinking';

interface InteractiveBotIconProps {
  state?: BotState;
  className?: string;
}

// --- Refactored Animation Logic ---

// Define animation properties for different states.
// This makes it easy to add new states like 'happy', 'surprised', etc. in the future.
const animations: Record<BotState, any> = {
  idle: {
    scaleY: [1, 1, 0.1, 1, 1], // Blink animation
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut',
    },
  },
  thinking: {
    x: [-1.2, 1.2, -1.2], // Look side-to-side
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Create a variants object that framer-motion's `motion` component can use.
// The keys ('idle', 'thinking') are used by the `animate` prop to select the animation.
const pupilVariants = {
  idle: animations.idle,
  thinking: animations.thinking,
};

// --- Component ---

const InteractiveBotIcon: React.FC<InteractiveBotIconProps> = ({ state = 'idle', className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
        {/* Path for the head with eye holes cut out */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15 1H9a8 8 0 0 0-8 8v6a8 8 0 0 0 8 8h6a8 8 0 0 0 8-8V9a8 8 0 0 0-8-8ZM8.5 14a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        />

        {/* Animated pupils, placed inside the eye holes */}
        <g fill="var(--text-secondary)">
            <motion.circle
                cx="8.5"
                cy="11.5"
                r="1.2"
                variants={pupilVariants}
                animate={state}
            />
            <motion.circle
                cx="15.5"
                cy="11.5"
                r="1.2"
                variants={pupilVariants}
                animate={state}
            />
        </g>
    </svg>
  );
};

export default InteractiveBotIcon;