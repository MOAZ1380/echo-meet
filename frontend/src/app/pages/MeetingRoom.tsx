import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
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
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { VideoTile } from "../components/VideoTile";
import { ControlButton } from "../components/ControlButton";
import { ChatPanel } from "../components/ChatPanel";
import { ParticipantsPanel } from "../components/ParticipantsPanel";
import type { Participant } from "../types/meeting";
import { useMeetingRoom } from "../hooks/useLivekitMeetingRoom";

/**
 * MeetingRoom Page Component
 * Main meeting interface with video grid, controls, and sidebars
 */

type SidebarType = "chat" | "participants" | null;

type MeetingLocationState = {
  userName?: string;
  mediaPreferences?: {
    micOn?: boolean;
    cameraOn?: boolean;
  };
};

export const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as MeetingLocationState | null) || null;
  const userName = state?.userName || "Guest";
  const initialMicOn = !!state?.mediaPreferences?.micOn;
  const initialCameraOn = !!state?.mediaPreferences?.cameraOn;
  const hasInitializedMediaRef = useRef(false);
  const hasJoinedRoomRef = useRef(false);

  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [meetingDuration, setMeetingDuration] = useState("00:00");
  const [showControls, setShowControls] = useState(true);

  const {
    localStream,
    remoteParticipants,
    chatMessages,
    socketStatus,
    micEnabled,
    camEnabled,
    isScreenSharing,
    ensureLocalMedia,
    joinMeeting,
    sendChatMessage,
    toggleCamera,
    toggleMic,
    leaveMeeting,
    toggleScreenShare,
  } = useMeetingRoom(userName);

  // Ensure media is prepared and respects lobby preferences.
  useEffect(() => {
    let isCancelled = false;

    const initializeMedia = async () => {
      if (hasInitializedMediaRef.current) return;

      await ensureLocalMedia();
      if (isCancelled) return;

      if (initialMicOn) {
        toggleMic();
      }

      if (initialCameraOn) {
        toggleCamera();
      }

      hasInitializedMediaRef.current = true;
    };

    void initializeMedia();

    return () => {
      isCancelled = true;
    };
  }, [
    ensureLocalMedia,
    initialCameraOn,
    initialMicOn,
    toggleCamera,
    toggleMic,
  ]);

  // Join meeting room once when room id is available.
  useEffect(() => {
    if (!meetingId || hasJoinedRoomRef.current) return;

    hasJoinedRoomRef.current = true;
    void joinMeeting(meetingId);
  }, [joinMeeting, meetingId]);

  useEffect(() => {
    if (!meetingId) {
      navigate("/");
    }
  }, [meetingId, navigate]);

  // Meeting duration timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setMeetingDuration(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const handleToggleSidebar = (sidebar: SidebarType) => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate("/");
  };

  const handleScreenShare = () => {
    void toggleScreenShare();
  };

  const participants = useMemo<Participant[]>(() => {
    const localParticipant: Participant = {
      id: "local-user",
      name: userName,
      isMicOn: micEnabled,
      isCameraOn: camEnabled,
      isSpeaking: false,
    };

    const remote = remoteParticipants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      isMicOn: participant.isMicOn,
      isCameraOn: participant.isCameraOn,
      isSpeaking: participant.isSpeaking,
    }));

    return [localParticipant, ...remote];
  }, [camEnabled, micEnabled, remoteParticipants, userName]);

  // Calculate grid layout based on participant count
  const getGridClass = () => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    return "grid-cols-4 grid-rows-2";
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
            activeSidebar ? "mr-0" : ""
          }`}
        >
          <div className={`h-full grid gap-4 ${getGridClass()} auto-rows-fr`}>
            <VideoTile
              key="local-user"
              participantId="local-user"
              participantName={userName}
              stream={localStream}
              isCameraOn={camEnabled || isScreenSharing}
              isScreenSharing={isScreenSharing}
              isMicOn={micEnabled}
              isSpeaking={false}
              isLocal={true}
              className="min-h-0"
            />

            {remoteParticipants.map((participant) => (
              <VideoTile
                key={participant.id}
                participantId={participant.id}
                participantName={participant.name}
                stream={participant.stream}
                isCameraOn={participant.isCameraOn}
                isMicOn={participant.isMicOn}
                isSpeaking={participant.isSpeaking}
                isLocal={false}
                className="min-h-0"
              />
            ))}
          </div>
        </div>

        {/* Sidebar (Chat or Participants) */}
        <AnimatePresence>
          {activeSidebar === "chat" && (
            <div className="w-80 flex-shrink-0">
              <ChatPanel
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                onClose={() => setActiveSidebar(null)}
              />
            </div>
          )}
          {activeSidebar === "participants" && (
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
              icon={micEnabled ? <Mic /> : <MicOff />}
              label={micEnabled ? "Mute" : "Unmute"}
              onClick={toggleMic}
              isActive={!micEnabled}
              variant={micEnabled ? "default" : "danger"}
              tooltip={
                micEnabled ? "Turn off microphone" : "Turn on microphone"
              }
            />

            {/* Camera */}
            <ControlButton
              icon={camEnabled ? <Video /> : <VideoOff />}
              label={camEnabled ? "Camera" : "Camera"}
              onClick={toggleCamera}
              isActive={!camEnabled}
              variant={camEnabled ? "default" : "danger"}
              tooltip={camEnabled ? "Turn off camera" : "Turn on camera"}
            />

            {/* Screen Share */}
            <ControlButton
              icon={isScreenSharing ? <MonitorOff /> : <Monitor />}
              label={isScreenSharing ? "Stop" : "Share"}
              onClick={handleScreenShare}
              isActive={isScreenSharing}
              tooltip={isScreenSharing ? "Stop sharing" : "Share screen"}
            />

            {/* Chat */}
            <ControlButton
              icon={<MessageSquare />}
              label="Chat"
              onClick={() => handleToggleSidebar("chat")}
              isActive={activeSidebar === "chat"}
              tooltip="Toggle chat"
            />

            {/* Participants */}
            <ControlButton
              icon={<Users />}
              label="People"
              onClick={() => handleToggleSidebar("participants")}
              isActive={activeSidebar === "participants"}
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
      {socketStatus !== "connected" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Connecting to meeting...</p>
        </div>
      )}
    </div>
  );
};
