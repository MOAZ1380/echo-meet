import React from 'react';
import { motion } from 'motion/react';
import { Video } from 'lucide-react';

/**
 * Navbar Component
 * Top navigation bar with app logo and meeting info
 */

interface NavbarProps {
  meetingCode?: string;
  meetingDuration?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ meetingCode, meetingDuration }) => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="absolute top-0 left-0 right-0 z-10 gradient-overlay-top"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-[var(--echo-primary)] p-2 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Echo Meet</h1>
            {meetingCode && (
              <p className="text-gray-300 text-xs">Meeting: {meetingCode}</p>
            )}
          </div>
        </div>

        {/* Meeting Duration */}
        {meetingDuration && (
          <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">{meetingDuration}</p>
          </div>
        )}
      </div>
    </motion.nav>
  );
};
