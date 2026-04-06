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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <article className={`video-tile ${isSelf ? "self" : ""}`}>
      <video ref={videoRef} autoPlay playsInline muted={muted} />
      <div className="video-label">{label}</div>
    </article>
  );
}
