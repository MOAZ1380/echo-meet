import React from 'react';
import { motion } from 'motion/react';

/**
 * ControlButton Component
 * Reusable button for meeting controls with icon, tooltip, and active state
 */

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  variant?: 'default' | 'danger';
  tooltip?: string;
  className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onClick,
  isActive = false,
  variant = 'default',
  tooltip,
  className = '',
}) => {
  const baseClasses = 'control-button relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-200 group';
  
  const variantClasses = {
    default: isActive
      ? 'bg-white text-gray-900 hover:bg-gray-100'
      : 'bg-gray-700 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <div className="tooltip-trigger relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        aria-label={label}
      >
        <div className="text-2xl">{icon}</div>
        <span className="text-xs hidden sm:block">{label}</span>
      </motion.button>
      
      {tooltip && (
        <div className="tooltip whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );
};
