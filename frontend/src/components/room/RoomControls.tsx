type RoomControlsProps = {
  loading: boolean;
  roomIdInput: string;
  setRoomIdInput: (value: string) => void;
  onCreateRoom: () => Promise<void>;
  onLoadRooms: () => Promise<void>;
  onJoinRoom: () => Promise<void>;
};

export function RoomControls({
  loading,
  roomIdInput,
  setRoomIdInput,
  onCreateRoom,
  onLoadRooms,
  onJoinRoom,
}: RoomControlsProps) {
  return (
    <div className="card">
      <h2>Rooms</h2>
      <div className="inline">
        <button disabled={loading} onClick={onCreateRoom} type="button">
          Create Room
        </button>
        <button disabled={loading} onClick={onLoadRooms} type="button">
          Load Rooms
        </button>
      </div>

      <div className="inline">
        <input
          type="text"
          placeholder="Room ID"
          value={roomIdInput}
          onChange={(event) => setRoomIdInput(event.target.value)}
        />
        <button disabled={loading} onClick={onJoinRoom} type="button">
          Join Room
        </button>
      </div>
    </div>
  );
}
