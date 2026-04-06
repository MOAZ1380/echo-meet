type MeetingControlsProps = {
  micEnabled: boolean;
  camEnabled: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
};

export function MeetingControls({
  micEnabled,
  camEnabled,
  onToggleMic,
  onToggleCam,
  onLeave,
  onToggleChat,
}: MeetingControlsProps) {
  return (
    <div className="meeting-controls">
      <button
        type="button"
        onClick={onToggleMic}
        className={micEnabled ? "" : "danger"}
      >
        {micEnabled ? "Mute Mic" : "Unmute Mic"}
      </button>
      <button
        type="button"
        onClick={onToggleCam}
        className={camEnabled ? "" : "danger"}
      >
        {camEnabled ? "Turn Camera Off" : "Turn Camera On"}
      </button>
      <button type="button" onClick={onToggleChat}>
        Chat
      </button>
      <button type="button" onClick={onLeave} className="danger">
        Leave
      </button>
    </div>
  );
}
