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
  ChevronDown,
  Bell,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "../components/Navbar";
import { VideoTile } from "../components/VideoTile";
import { ControlButton } from "../components/ControlButton";
import { ChatPanel } from "../components/ChatPanel";
import { ParticipantsPanel } from "../components/ParticipantsPanel";
import type { Participant } from "../types/meeting";
import { useMeetingRoom } from "../hooks/useLivekitMeetingRoom";
import { useRoomChat } from "../hooks/useRoomChat";
import { getJsonCookie } from "../utils/cookies";
import { getCurrentParticipantId } from "../utils/participantId";
import { getErrorMessage } from "../utils/errorMessage";

/**
 * MeetingRoom Page Component
 * Main meeting interface with video grid, controls, and sidebars
 */

type SidebarType = "chat" | "participants" | null;

// Data passed from the lobby through navigation state.
type MeetingLocationState = {
  userName?: string;
  participantId?: string;
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
  const stateParticipantId = state?.participantId;
  const initialMicOn = !!state?.mediaPreferences?.micOn;
  const initialCameraOn = !!state?.mediaPreferences?.cameraOn;
  const hasInitializedMediaRef = useRef(false);
  const hasJoinedRoomRef = useRef(false);
  const participantIdRef = useRef<string>("");

  // Get current user (room owner) ID
  const currentUser = useMemo(() => {
    return getJsonCookie<{ id?: string }>("echo_user");
  }, []);

  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [meetingDuration, setMeetingDuration] = useState("00:00");
  const [showControls, setShowControls] = useState(true);
  const [showJoinRequestsPanel, setShowJoinRequestsPanel] = useState(false);
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
    void joinMeeting(meetingId).catch((error) => {
      toast.error(
        getErrorMessage(
          error,
          "Unable to join this room. It may not exist anymore.",
        ),
      );
      navigate("/");
    });
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
    const finalParticipantId =
      stateParticipantId || user?.id || getCurrentParticipantId();

    if (!finalParticipantId) return;

    participantIdRef.current = finalParticipantId;
    joinRoom(meetingId, finalParticipantId);
  }, [meetingId, stateParticipantId]);

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
        <div className="absolute top-20 right-4 z-50 flex flex-col items-end gap-3">
          <button
            onClick={() => setShowJoinRequestsPanel((prev) => !prev)}
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900/90"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20 transition group-hover:bg-emerald-500/25">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-950 shadow-sm">
                {joinRequests.length}
              </span>
            </span>
            <span className="flex items-center gap-2">
              Join requests
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showJoinRequestsPanel ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          <AnimatePresence>
            {showJoinRequestsPanel && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Pending join requests
                    </p>
                    <p className="text-xs text-slate-400">
                      Review who can enter the room.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowJoinRequestsPanel(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    aria-label="Close join requests panel"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                </div>

                <div className="max-h-[28rem] space-y-3 overflow-y-auto p-3">
                  {joinRequests.map((req, index) => {
                    const participantName = req.participant?.name || req.userId;
                    const participantId = req.participant?.id || req.userId;

                    return (
                      <div
                        key={`${req.userId}-${req.roomId}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 text-cyan-100 ring-1 ring-white/10">
                            <UserX className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {participantName}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Wants to join the meeting
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() =>
                              approveUser(
                                req.roomId,
                                participantId,
                                currentUser?.id,
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              rejectUser(
                                req.roomId,
                                participantId,
                                currentUser?.id,
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
