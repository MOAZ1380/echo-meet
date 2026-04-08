import { useEffect, useRef } from "react";

type VideoTileProps = {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  isSelf?: boolean;
};

export function VideoTile({
  stream,
  label,
  muted = false,
  isSelf = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasVideoTrack = Boolean(stream?.getVideoTracks().length);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <article className={`video-tile ${isSelf ? "self" : ""}`}>
      {hasVideoTrack ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      ) : (
        <div className="video-avatar">{label.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="video-label">{label}</div>
    </article>
  );
}
