type MeetingControlsProps = {
  micEnabled: boolean;
  camEnabled: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
};

export function MeetingControls({
  micEnabled,
  camEnabled,
  isScreenSharing,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onLeave,
  onToggleChat,
}: MeetingControlsProps) {
  return (
    <div className="meeting-controls">
      <button
        type="button"
        onClick={onToggleMic}
        className={micEnabled ? "control-btn" : "control-btn danger"}
      >
        {micEnabled ? "Mute" : "Unmute"}
      </button>
      <button
        type="button"
        onClick={onToggleCam}
        className={camEnabled ? "control-btn" : "control-btn danger"}
      >
        {camEnabled ? "Camera" : "Camera Off"}
      </button>
      <button
        type="button"
        onClick={onToggleScreenShare}
        className={isScreenSharing ? "control-btn active" : "control-btn"}
      >
        {isScreenSharing ? "Stop Share" : "Share"}
      </button>
      <button type="button" onClick={onToggleChat} className="control-btn">
        Chat
      </button>
      <button type="button" onClick={onLeave} className="control-btn danger">
        Leave
      </button>
    </div>
  );
}
