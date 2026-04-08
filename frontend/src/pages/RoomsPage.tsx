import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createRoom, getRoomById, getRooms } from "../api/roomApi";
import { StatusMessage } from "../components/common/StatusMessage";
import { RoomControls } from "../components/room/RoomControls";
import { RoomList } from "../components/room/RoomList";
import { useAuth } from "../hooks/useAuth";
import type { Room } from "../types/room";

export function RoomsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  function resetStatus() {
    setInfo("");
    setError("");
  }

  async function handleLoadRooms() {
    setLoading(true);
    resetStatus();

    try {
      const list = await getRooms(auth.token);
      setRooms(list);
      setInfo("Rooms loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load rooms");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    setLoading(true);
    resetStatus();

    try {
      const room = await createRoom(auth.token);
      setRooms((prev) => [room, ...prev]);
      setRoomIdInput(room.id);
      setInfo(`Room ${room.id} created`);
      navigate(`/meet/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot create room");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    const roomId = roomIdInput.trim();

    if (!roomId) {
      setError("Enter room id");
      return;
    }

    setLoading(true);
    resetStatus();

    try {
      await getRoomById(auth.token, roomId);
      setInfo("Opening meeting...");
      navigate(`/meet/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot join room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="rooms-page">
      <section className="rooms-shell">
        <header className="rooms-header">
          <div>
            <p className="rooms-eyebrow">Rooms dashboard</p>
            <h1>Echo Meet</h1>
            <p className="small">Signed in as {auth.user?.email}</p>
          </div>

          <div className="rooms-header-actions">
            <button onClick={() => navigate("/join")} type="button">
              Open join page
            </button>
            <button onClick={auth.logout} type="button" className="danger">
              Logout
            </button>
          </div>
        </header>

        <StatusMessage info={info} error={error} />

        <RoomControls
          loading={loading}
          roomIdInput={roomIdInput}
          setRoomIdInput={setRoomIdInput}
          onCreateRoom={handleCreateRoom}
          onLoadRooms={handleLoadRooms}
          onJoinRoom={handleJoinRoom}
        />

        <section className="rooms-list-card">
          <h2>Available Rooms</h2>
          <RoomList rooms={rooms} onSelectRoomId={setRoomIdInput} />
        </section>
      </section>
    </main>
  );
}
