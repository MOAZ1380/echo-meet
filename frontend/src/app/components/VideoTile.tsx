import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, MicOff } from "lucide-react";

/**
 * VideoTile Component
 * Displays a participant's video stream or avatar with name overlay
 */

interface VideoTileProps {
  participantId: string;
  participantName: string;
  stream?: MediaStream | null;
  isCameraOn: boolean;
  isScreenSharing?: boolean;
  isMicOn: boolean;
  isSpeaking?: boolean;
  isLocal?: boolean;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participantId,
  participantName,
  stream,
  isCameraOn,
  isScreenSharing = false,
  isMicOn,
  isSpeaking = false,
  isLocal = false,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream && isCameraOn) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOn]);

  // Generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-gray-800 rounded-lg overflow-hidden video-tile-enter ${
        isSpeaking ? "speaking-indicator ring-4 ring-[var(--echo-primary)]" : ""
      } ${className}`}
    >
      {/* Video Element */}
      {isCameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? "video-mirror" : ""}`}
        />
      ) : (
        /* Avatar Fallback */
        <div
          className={`w-full h-full flex items-center justify-center ${getAvatarColor(participantName)}`}
        >
          <span className="text-4xl font-semibold text-white">
            {getInitials(participantName)}
          </span>
        </div>
      )}

      {/* Overlay with participant info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">
            {participantName}
          </span>

          {/* Mic indicator */}
          <div
            className={`p-1 rounded ${isMicOn ? "bg-transparent" : "bg-red-500"}`}
          >
            {!isMicOn && <MicOff className="w-4 h-4 text-white" />}
          </div>
        </div>
      </div>

      {/* Speaking indicator visual */}
      {isSpeaking && (
        <div className="absolute top-2 left-2 bg-[var(--echo-primary)] text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Mic className="w-3 h-3" />
          <span>Speaking</span>
        </div>
      )}
    </motion.div>
  );
};
