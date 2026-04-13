import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { getLivekitToken } from "../api/livekitApi";
import type { ChatMessage, Participant } from "../types/meeting";

type RemoteParticipantWithStream = Participant & {
  stream: MediaStream | null;
};

type ChatPayload = {
  type?: "chat";
  text?: string;
  sender?: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type EnvImportMeta = ImportMeta & {
  env: {
    VITE_LIVEKIT_URL?: string;
  };
};

function trackToMediaStreamTrack(
  track: { mediaStreamTrack?: MediaStreamTrack } | undefined,
) {
  return track?.mediaStreamTrack;
}

export function useMeetingRoom(displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipantWithStream[]
  >([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [joinedRoomId, setJoinedRoomId] = useState("");
  const [socketStatus, setSocketStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const roomIdRef = useRef("");
  const localUserIdRef = useRef("local-user");
  const micEnabledRef = useRef(false);
  const camEnabledRef = useRef(false);
  const isScreenSharingRef = useRef(false);

  const buildLocalPreviewStream = useCallback((room: Room) => {
    const stream = new MediaStream();

    const localTracks = Array.from(
      room.localParticipant.trackPublications.values(),
    );

    const screenTrack = localTracks.find(
      (item) => item.source === Track.Source.ScreenShare,
    );
    const cameraTrack = localTracks.find(
      (item) => item.source === Track.Source.Camera,
    );
    const audioTrack = localTracks.find(
      (item) => item.source === Track.Source.Microphone,
    );

    const activeVideoPublication = isScreenSharingRef.current
      ? screenTrack
      : cameraTrack;

    const videoTrack = trackToMediaStreamTrack(activeVideoPublication?.track);
    const micTrack = trackToMediaStreamTrack(audioTrack?.track);

    if (videoTrack) {
      stream.addTrack(videoTrack);
    }

    if (micTrack && micEnabledRef.current) {
      stream.addTrack(micTrack);
    }

    return stream.getTracks().length > 0 ? stream : null;
  }, []);

  const buildRemoteParticipants = useCallback((room: Room) => {
    const peers: RemoteParticipantWithStream[] = [];

    room.remoteParticipants.forEach((participant) => {
      const stream = new MediaStream();

      const videoTracks = Array.from(
        participant.videoTrackPublications.values(),
      );
      const audioTracks = Array.from(
        participant.audioTrackPublications.values(),
      );

      videoTracks.forEach((publication) => {
        const track = trackToMediaStreamTrack(publication.track);
        if (track) {
          stream.addTrack(track);
        }
      });

      audioTracks.forEach((publication) => {
        const track = trackToMediaStreamTrack(publication.track);
        if (track) {
          stream.addTrack(track);
        }
      });

      const micPublication = audioTracks[0];
      const cameraPublication = videoTracks.find(
        (item) => item.source === Track.Source.Camera,
      );

      peers.push({
        id: participant.identity,
        name: participant.identity,
        isMicOn: !!micPublication && !micPublication.isMuted,
        isCameraOn: !!cameraPublication && !cameraPublication.isMuted,
        isSpeaking: participant.isSpeaking,
        stream: stream.getTracks().length > 0 ? stream : null,
      });
    });

    return peers;
  }, []);

  const syncParticipantState = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    setRemoteParticipants(buildRemoteParticipants(room));
    setLocalStream(buildLocalPreviewStream(room));
  }, [buildLocalPreviewStream, buildRemoteParticipants]);

  const applyDeviceState = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    await room.localParticipant.setMicrophoneEnabled(micEnabledRef.current);
    await room.localParticipant.setCameraEnabled(camEnabledRef.current);
    await room.localParticipant.setScreenShareEnabled(
      isScreenSharingRef.current,
    );

    syncParticipantState();
  }, [syncParticipantState]);

  const registerRoomListeners = useCallback(
    (room: Room) => {
      room
        .on(RoomEvent.Connected, () => {
          setSocketStatus("connected");
          syncParticipantState();
        })
        .on(RoomEvent.Disconnected, () => {
          setSocketStatus("disconnected");
          setRemoteParticipants([]);
          setLocalStream(null);
        })
        .on(RoomEvent.ParticipantConnected, syncParticipantState)
        .on(RoomEvent.ParticipantDisconnected, syncParticipantState)
        .on(RoomEvent.TrackSubscribed, syncParticipantState)
        .on(RoomEvent.TrackUnsubscribed, syncParticipantState)
        .on(RoomEvent.TrackMuted, syncParticipantState)
        .on(RoomEvent.TrackUnmuted, syncParticipantState)
        .on(RoomEvent.ActiveSpeakersChanged, syncParticipantState)
        .on(RoomEvent.LocalTrackPublished, syncParticipantState)
        .on(RoomEvent.LocalTrackUnpublished, syncParticipantState)
        .on(RoomEvent.DataReceived, (payload, participant) => {
          if (!participant || participant.identity === localUserIdRef.current) {
            return;
          }

          try {
            const parsed = JSON.parse(
              textDecoder.decode(payload),
            ) as ChatPayload;
            const messageText = parsed.text;
            if (parsed.type !== "chat" || typeof messageText !== "string") {
              return;
            }

            const trimmedText = messageText.trim();
            if (!trimmedText) return;

            setChatMessages((prev) => [
              ...prev,
              {
                id: `${participant.identity}-${Date.now()}-${Math.random()}`,
                senderId: participant.identity,
                senderName: parsed.sender || participant.identity,
                message: trimmedText,
                timestamp: new Date(),
              },
            ]);
          } catch {
            // Ignore non-chat messages.
          }
        });
    },
    [syncParticipantState],
  );

  const ensureLocalMedia = useCallback(async () => {
    // Keep this hook API stable for the page flow. Actual device setup happens on room connect.
    return;
  }, []);

  const joinMeeting = useCallback(
    async (roomId: string) => {
      const livekitUrl = (import.meta as EnvImportMeta).env.VITE_LIVEKIT_URL;
      console.log("Joining room:", livekitUrl, roomId, displayName);
      if (!livekitUrl) {
        throw new Error("VITE_LIVEKIT_URL is not configured");
      }

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current.removeAllListeners();
        roomRef.current = null;
      }

      const identity = displayName?.trim() || `guest-${Date.now()}`;
      localUserIdRef.current = identity;
      roomIdRef.current = roomId;

      const { token } = await getLivekitToken(identity, roomId);

      const room = new Room();
      roomRef.current = room;
      registerRoomListeners(room);

      await room.connect(livekitUrl, token);
      await applyDeviceState();

      setJoinedRoomId(roomId);
    },
    [applyDeviceState, displayName, registerRoomListeners],
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;

      const room = roomRef.current;
      if (!room) return;

      const localMessage: ChatMessage = {
        id: `local-${Date.now()}-${Math.random()}`,
        senderId: "local-user",
        senderName: displayName || "Guest",
        message: value,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, localMessage]);

      void room.localParticipant.publishData(
        textEncoder.encode(
          JSON.stringify({
            type: "chat",
            text: value,
            sender: displayName || "Guest",
          }),
        ),
        {
          reliable: true,
          topic: "chat",
        },
      );
    },
    [displayName],
  );

  const toggleMic = useCallback(() => {
    const nextEnabled = !micEnabledRef.current;
    micEnabledRef.current = nextEnabled;
    setMicEnabled(nextEnabled);

    const room = roomRef.current;
    if (!room) return;

    void room.localParticipant
      .setMicrophoneEnabled(nextEnabled)
      .then(syncParticipantState);
  }, [syncParticipantState]);

  const toggleCamera = useCallback(() => {
    const nextEnabled = !camEnabledRef.current;
    camEnabledRef.current = nextEnabled;
    setCamEnabled(nextEnabled);

    const room = roomRef.current;
    if (!room) return;

    void room.localParticipant
      .setCameraEnabled(nextEnabled)
      .then(syncParticipantState);
  }, [syncParticipantState]);

  const toggleScreenShare = useCallback(async () => {
    const nextEnabled = !isScreenSharingRef.current;
    isScreenSharingRef.current = nextEnabled;
    setIsScreenSharing(nextEnabled);

    const room = roomRef.current;
    if (!room) return;

    try {
      await room.localParticipant.setScreenShareEnabled(nextEnabled);
      syncParticipantState();
    } catch {
      isScreenSharingRef.current = !nextEnabled;
      setIsScreenSharing(!nextEnabled);
    }
  }, [syncParticipantState]);

  const leaveMeeting = useCallback(() => {
    const room = roomRef.current;

    if (room) {
      room.disconnect();
      room.removeAllListeners();
      roomRef.current = null;
    }

    setRemoteParticipants([]);
    setLocalStream(null);
    setChatMessages([]);
    setJoinedRoomId("");
    setSocketStatus("disconnected");
    roomIdRef.current = "";
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, [leaveMeeting]);

  return {
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
  };
}
