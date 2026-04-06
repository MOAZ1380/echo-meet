import { useState } from "react";
import type { ChatMessage } from "../../types/chat";

type ChatBoxProps = {
  roomId: string;
  messages: ChatMessage[];
  onSend: (message: string) => void;
};

export function ChatBox({ roomId, messages, onSend }: ChatBoxProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  }

  return (
    <div className="card">
      <h2>Room Chat</h2>
      <p className="small">Joined room: {roomId}</p>

      <div className="chat-box">
        {messages.length ? (
          messages.map((item, index) => (
            <p key={`${item.userId}-${index}`} className="chat-item">
              <strong>{item.userId.slice(0, 6)}:</strong> {item.message}
            </p>
          ))
        ) : (
          <p className="small">No messages yet</p>
        )}
      </div>

      <div className="inline">
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
