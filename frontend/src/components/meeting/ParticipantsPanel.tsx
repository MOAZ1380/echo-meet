type Participant = {
  id: string;
};

type ParticipantsPanelProps = {
  isOpen: boolean;
  localName: string;
  participants: Participant[];
};

export function ParticipantsPanel({
  isOpen,
  localName,
  participants,
}: ParticipantsPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="participants-panel">
      <header className="participants-panel-header">
        <h3>Participants</h3>
        <span>{participants.length + 1} total</span>
      </header>

      <ul>
        <li>
          <strong>{localName}</strong>
          <span>You</span>
        </li>
        {participants.map((participant) => (
          <li key={participant.id}>
            <strong>Participant {participant.id.slice(0, 6)}</strong>
            <span>Remote</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
