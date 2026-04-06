import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function JoinPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [roomId, setRoomId] = useState("");

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="brand">Echo Meet</div>
        <div className="landing-actions">
          {isAuthenticated ? (
            <button type="button" onClick={() => navigate("/rooms")}>
              Create Room
            </button>
          ) : (
            <button type="button" onClick={() => navigate("/auth")}>
              Sign in to Create Room
            </button>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <h1>Video calls for everyone</h1>
        <p>
          Join a room directly with room code. No account required for joining.
        </p>

        <div className="landing-join-box">
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Enter room code"
          />
          <button
            type="button"
            onClick={() => {
              const value = roomId.trim();
              if (!value) return;
              navigate(`/meet/${value}`);
            }}
          >
            Join Now
          </button>
        </div>
      </section>
    </main>
  );
}
