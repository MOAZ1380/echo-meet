import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
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
import { useRoomChat } from "../hooks/useRoomChat";
import { getJsonCookie } from "../utils/cookies";

/**
 * MeetingRoom Page Component
 * Main meeting interface with video grid, controls, and sidebars
 */

type SidebarType = "chat" | "participants" | null;

// Data passed from the lobby through navigation state.
type MeetingLocationState = {
  userName?: string;
  mediaPreferences?: {
    micOn?: boolean;
    cameraOn?: boolean;
  };
};

// Main meeting screen: connects LiveKit state, controls, and side panels.
export const MeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { joinRoom, joinRequests, approveUser, rejectUser } = useRoomChat();
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
  const [joinPopupText, setJoinPopupText] = useState("");
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const previousRemoteIdsRef = useRef<string[]>([]);
  const hasParticipantSnapshotRef = useRef(false);
  const joinPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Meeting-room behavior comes from the LiveKit hook.
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

  // Prepare the local media state once, then apply the lobby's mic/camera choices.
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

  // Join the LiveKit room once per mount.
  useEffect(() => {
    if (!meetingId || hasJoinedRoomRef.current) return;

    hasJoinedRoomRef.current = true;
    void joinMeeting(meetingId);
  }, [joinMeeting, meetingId]);

  // Redirect back home if the route does not include a meeting id.
  useEffect(() => {
    if (!meetingId) {
      navigate("/");
    }
  }, [meetingId, navigate]);

  // Drive the on-screen meeting timer.
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

  // Keep controls visible while the pointer moves, then fade them out after a delay.
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

  // Show a short popup when one or more new remote participants join.
  useEffect(() => {
    const remoteIds = remoteParticipants.map((participant) => participant.id);

    if (!hasParticipantSnapshotRef.current) {
      previousRemoteIdsRef.current = remoteIds;
      hasParticipantSnapshotRef.current = true;
      return;
    }

    const previousIds = new Set(previousRemoteIdsRef.current);
    const joinedParticipants = remoteParticipants.filter(
      (participant) => !previousIds.has(participant.id),
    );

    previousRemoteIdsRef.current = remoteIds;

    if (joinedParticipants.length === 0) return;

    const text =
      joinedParticipants.length === 1
        ? `${joinedParticipants[0].name} joined the room`
        : `${joinedParticipants.length} people joined the room`;

    setJoinPopupText(text);
    setShowJoinPopup(true);

    if (joinPopupTimeoutRef.current) {
      clearTimeout(joinPopupTimeoutRef.current);
    }

    joinPopupTimeoutRef.current = setTimeout(() => {
      setShowJoinPopup(false);
    }, 2500);
  }, [remoteParticipants]);

  useEffect(() => {
    return () => {
      if (joinPopupTimeoutRef.current) {
        clearTimeout(joinPopupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!meetingId) return;

    const user = getJsonCookie<{ id?: string }>("echo_user");

    if (!user?.id) return;

    joinRoom(meetingId, user.id);
  }, [meetingId]);

  // Toggle the active sidebar without leaving the meeting view.
  const handleToggleSidebar = (sidebar: SidebarType) => {
    setActiveSidebar(activeSidebar === sidebar ? null : sidebar);
  };

  // Disconnect from the room before navigating away.
  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate("/");
  };

  // Screen share is handled by the LiveKit hook.
  const handleScreenShare = () => {
    void toggleScreenShare();
  };

  // Merge the local participant and remote peers into a single grid model.
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

  // Pick a grid layout that roughly matches the current participant count.
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

      {joinRequests.length > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-96 space-y-3">
          {joinRequests.map((req, index) => (
            <div
              key={`${req.userId}-${req.roomId}-${index}`}
              className="bg-gray-800 border border-gray-600 rounded-xl p-4 shadow-lg flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">
                  {req.participant?.name || req.userId}
                </p>
                <p className="text-gray-400 text-sm">
                  wants to join the meeting
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approveUser(req.roomId, req.userId)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Accept
                </button>

                <button
                  onClick={() => rejectUser(req.roomId, req.userId)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showJoinPopup && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 right-4 z-50 bg-emerald-600/95 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm"
          >
            <p className="text-sm font-medium">{joinPopupText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
