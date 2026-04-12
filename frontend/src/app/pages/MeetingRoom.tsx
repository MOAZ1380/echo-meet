import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  PhoneOff,
  MoreVertical,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { VideoTile } from '../components/VideoTile';
import { ControlButton } from '../components/ControlButton';
import { ChatPanel } from '../components/ChatPanel';
import { ParticipantsPanel } from '../components/ParticipantsPanel';
import { useMediaStream } from '../hooks/useMediaStream';
import { useSocket } from '../hooks/useSocket';

/**
 * MeetingRoom Page Component
 * Main meeting interface with video grid, controls, and sidebars
 */

type SidebarType = 'chat' | 'participants' | null;

export const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName || 'Guest';

  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [meetingDuration, setMeetingDuration] = useState('00:00');
  const [showControls, setShowControls] = useState(true);

  // Hooks
  const {
    stream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    toggleCamera,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    stopStream,
  } = useMediaStream();

  const {
    isConnected,
    participants,
    messages,
    joinMeeting,
    leaveMeeting,
    sendMessage,
  } = useSocket(meetingId);

  // Initialize meeting
  useEffect(() => {
    joinMeeting(userName);
  }, [joinMeeting, userName]);

  // Meeting duration timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setMeetingDuration(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const handleToggleSidebar = (sidebar: SidebarType) => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    stopStream();
    navigate('/');
  };

  const handleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Calculate grid layout based on participant count
  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-4 grid-rows-2';
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--echo-dark-bg)] overflow-hidden">
      {/* Top Navbar */}
      {showControls && (
        <Navbar meetingCode={meetingId} meetingDuration={meetingDuration} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <div
          className={`flex-1 p-4 transition-all duration-300 ${
            activeSidebar ? 'mr-0' : ''
          }`}
        >
          <div className={`h-full grid gap-4 ${getGridClass()} auto-rows-fr`}>
            {participants.map((participant) => (
              <VideoTile
                key={participant.id}
                participantId={participant.id}
                participantName={participant.name}
                stream={participant.id === 'user-1' ? stream : null}
                isCameraOn={participant.isCameraOn}
                isMicOn={participant.isMicOn}
                isSpeaking={participant.isSpeaking}
                isLocal={participant.id === 'user-1'}
                className="min-h-0"
              />
            ))}
          </div>
        </div>

        {/* Sidebar (Chat or Participants) */}
        <AnimatePresence>
          {activeSidebar === 'chat' && (
            <div className="w-80 flex-shrink-0">
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                onClose={() => setActiveSidebar(null)}
              />
            </div>
          )}
          {activeSidebar === 'participants' && (
            <div className="w-80 flex-shrink-0">
              <ParticipantsPanel
                participants={participants}
                onClose={() => setActiveSidebar(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Bar */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 gradient-overlay-bottom">
          <div className="flex items-center justify-center gap-3 px-6 py-6">
            {/* Microphone */}
            <ControlButton
              icon={isMicOn ? <Mic /> : <MicOff />}
              label={isMicOn ? 'Mute' : 'Unmute'}
              onClick={toggleMic}
              isActive={!isMicOn}
              variant={isMicOn ? 'default' : 'danger'}
              tooltip={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
            />

            {/* Camera */}
            <ControlButton
              icon={isCameraOn ? <Video /> : <VideoOff />}
              label={isCameraOn ? 'Camera' : 'Camera'}
              onClick={toggleCamera}
              isActive={!isCameraOn}
              variant={isCameraOn ? 'default' : 'danger'}
              tooltip={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            />

            {/* Screen Share */}
            <ControlButton
              icon={isScreenSharing ? <MonitorOff /> : <Monitor />}
              label={isScreenSharing ? 'Stop' : 'Share'}
              onClick={handleScreenShare}
              isActive={isScreenSharing}
              tooltip={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            />

            {/* Chat */}
            <ControlButton
              icon={<MessageSquare />}
              label="Chat"
              onClick={() => handleToggleSidebar('chat')}
              isActive={activeSidebar === 'chat'}
              tooltip="Toggle chat"
            />

            {/* Participants */}
            <ControlButton
              icon={<Users />}
              label="People"
              onClick={() => handleToggleSidebar('participants')}
              isActive={activeSidebar === 'participants'}
              tooltip="View participants"
            />

            {/* More Options */}
            <ControlButton
              icon={<MoreVertical />}
              label="More"
              onClick={() => {}}
              tooltip="More options"
            />

            {/* Leave Meeting */}
            <ControlButton
              icon={<PhoneOff />}
              label="Leave"
              onClick={handleLeaveMeeting}
              variant="danger"
              tooltip="Leave meeting"
              className="ml-4"
            />
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Connecting to meeting...</p>
        </div>
      )}
    </div>
  );
};
