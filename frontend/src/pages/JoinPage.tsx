import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function JoinPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [roomId, setRoomId] = useState("");

  return (
    <main className="landing-page">
      <section className="landing-shell">
        <div className="landing-left">
          <p className="landing-eyebrow">Live collaboration platform</p>
          <h1>Echo Meet</h1>
          <p>
            Join meetings instantly with a room code. Sign in when you want to
            create and manage rooms.
          </p>

          <ul className="landing-feature-list">
            <li>HD video meetings</li>
            <li>In-call chat with realtime updates</li>
            <li>No account needed to join</li>
          </ul>
        </div>

        <div className="landing-right">
          <article className="landing-card">
            <h2>Join a meeting</h2>
            <p className="small">Enter the room id you received.</p>
            <div className="landing-join-box">
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                placeholder="Enter room code"
              />
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const value = roomId.trim();
                  if (!value) return;
                  navigate(`/meet/${value}`);
                }}
              >
                Join now
              </button>
            </div>
          </article>

          <article className="landing-card">
            <h2>Create a room</h2>
            <p className="small">Create private rooms from your dashboard.</p>
            {isAuthenticated ? (
              <button type="button" onClick={() => navigate("/rooms")}>
                Open rooms dashboard
              </button>
            ) : (
              <button type="button" onClick={() => navigate("/auth/login")}>
                Sign in to create
              </button>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
