import type { Room } from "../../types/room";

type RoomListProps = {
  rooms: Room[];
  onSelectRoomId: (roomId: string) => void;
};

export function RoomList({ rooms, onSelectRoomId }: RoomListProps) {
  if (!rooms.length) {
    return <p className="small">No rooms yet</p>;
  }

  return (
    <ul className="rooms-list">
      {rooms.map((room) => (
        <li key={room.id}>
          <span>{room.id}</span>
          <button type="button" onClick={() => onSelectRoomId(room.id)}>
            Use ID
          </button>
        </li>
      ))}
    </ul>
  );
}
