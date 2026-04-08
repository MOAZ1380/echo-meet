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
    <section className="rooms-controls-card">
      <header>
        <h2>Room Controls</h2>
        <p className="small">Create, list, and join meetings by room id.</p>
      </header>

      <div className="rooms-controls-actions">
        <button
          disabled={loading}
          onClick={onCreateRoom}
          type="button"
          className="primary"
        >
          {loading ? "Working..." : "Create Room"}
        </button>
        <button disabled={loading} onClick={onLoadRooms} type="button">
          Load Rooms
        </button>
      </div>

      <div className="rooms-join-box">
        <input
          type="text"
          placeholder="Paste room id"
          value={roomIdInput}
          onChange={(event) => setRoomIdInput(event.target.value)}
        />
        <button
          disabled={loading}
          onClick={onJoinRoom}
          type="button"
          className="primary"
        >
          Join Room
        </button>
      </div>
    </section>
  );
}
