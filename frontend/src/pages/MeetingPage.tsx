import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeetingChatPanel } from "../components/meeting/MeetingChatPanel";
import { MeetingControls } from "../components/meeting/MeetingControls";
import { VideoTile } from "../components/meeting/VideoTile";
import { useAuth } from "../hooks/useAuth";
import { useMeetingRoom } from "../hooks/useMeetingRoom";

export function MeetingPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [displayName, setDisplayName] = useState(() => user?.email || "Guest");
  const [isReady, setIsReady] = useState(false);

  const {
    localStream,
    remoteParticipants,
    chatMessages,
    joinedRoomId,
    socketStatus,
    micEnabled,
    camEnabled,
    isScreenSharing,
    ensureLocalMedia,
    joinMeeting,
    sendChatMessage,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    leaveMeeting,
  } = useMeetingRoom(displayName);

  const participantCount = useMemo(
    () => remoteParticipants.length + (localStream ? 1 : 0),
    [remoteParticipants.length, localStream],
  );

  useEffect(() => {
    let mounted = true;

    async function prepareAndJoin() {
      try {
        await ensureLocalMedia();
        if (!mounted) return;
        await joinMeeting(roomId);
        if (!mounted) return;
        setIsReady(true);
      } catch {
        if (!mounted) return;
        setIsReady(false);
      }
    }

    if (roomId) {
      prepareAndJoin();
    }

    return () => {
      mounted = false;
    };
  }, [roomId, ensureLocalMedia, joinMeeting]);

  return (
    <main className="meeting-page">
      <header className="meeting-topbar">
        <div className="meeting-brand">Echo Meet</div>
        <div className="meeting-meta">
          <span>Room: {joinedRoomId || roomId}</span>
          <span>Participants: {participantCount}</span>
          <span>Socket: {socketStatus}</span>
        </div>
      </header>

      <section className="meeting-stage">
        <div className="meeting-grid">
          <VideoTile
            stream={localStream}
            label={`${displayName} (You)`}
            muted
            isSelf
          />
          {remoteParticipants.map((participant) => (
            <VideoTile
              key={participant.id}
              stream={participant.stream}
              label={`Participant ${participant.id.slice(0, 6)}`}
            />
          ))}
        </div>

        <MeetingChatPanel
          isOpen={chatOpen}
          messages={chatMessages}
          onSend={sendChatMessage}
        />
      </section>

      <footer className="meeting-bottombar">
        <div className="meeting-name-input">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
          />
        </div>

        <MeetingControls
          micEnabled={micEnabled}
          camEnabled={camEnabled}
          isScreenSharing={isScreenSharing}
          onToggleMic={toggleMic}
          onToggleCam={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={() => setChatOpen((prev) => !prev)}
          onLeave={() => {
            leaveMeeting();
            navigate("/join");
          }}
        />

        <div className="meeting-ready">
          {isReady ? "Connected" : "Connecting..."}
        </div>
      </footer>
    </main>
  );
}
