import React from 'react';
import { motion } from 'motion/react';
import { X, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { Participant } from '../hooks/useSocket';

/**
 * ParticipantsPanel Component
 * Displays list of participants with their status (mic/camera on/off)
 */

interface ParticipantsPanelProps {
  participants: Participant[];
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  onClose,
}) => {
  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full bg-gray-800 flex flex-col border-l border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">
            Participants ({participants.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close participants"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((participant) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(
                participant.name
              )}`}
            >
              <span className="text-sm font-semibold text-white">
                {getInitials(participant.name)}
              </span>
            </div>

            {/* Participant Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {participant.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {participant.isMicOn ? (
                  <Mic className="w-3 h-3 text-green-400" />
                ) : (
                  <MicOff className="w-3 h-3 text-red-400" />
                )}
                {participant.isCameraOn ? (
                  <Video className="w-3 h-3 text-green-400" />
                ) : (
                  <VideoOff className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>

            {/* Speaking Indicator */}
            {participant.isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-[var(--echo-primary)] rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer with participant count summary */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-green-400" />
            <span>{participants.filter(p => p.isMicOn).length} unmuted</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-green-400" />
            <span>{participants.filter(p => p.isCameraOn).length} with video</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
