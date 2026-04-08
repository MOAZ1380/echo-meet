import type { Room } from "../../types/room";

type RoomListProps = {
  rooms: Room[];
  onSelectRoomId: (roomId: string) => void;
};

export function RoomList({ rooms, onSelectRoomId }: RoomListProps) {
  if (!rooms.length) {
    return <p className="small">No rooms yet. Create your first room.</p>;
  }

  return (
    <ul className="rooms-list">
      {rooms.map((room) => (
        <li key={room.id}>
          <div className="rooms-list-meta">
            <span className="rooms-list-label">Room ID</span>
            <code>{room.id}</code>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoomId(room.id)}
            className="ghost"
          >
            Use ID
          </button>
        </li>
      ))}
    </ul>
  );
}
