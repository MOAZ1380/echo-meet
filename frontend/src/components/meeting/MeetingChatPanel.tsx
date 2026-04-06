import { useState } from "react";

type ChatItem = {
  id: string;
  sender: string;
  text: string;
};

type MeetingChatPanelProps = {
  messages: ChatItem[];
  onSend: (text: string) => void;
  isOpen: boolean;
};

export function MeetingChatPanel({
  messages,
  onSend,
  isOpen,
}: MeetingChatPanelProps) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  return (
    <aside className="meeting-chat-panel">
      <h3>In-call chat</h3>
      <div className="meeting-chat-list">
        {messages.length ? (
          messages.map((item) => (
            <p key={item.id} className="meeting-chat-item">
              <strong>{item.sender}: </strong>
              {item.text}
            </p>
          ))
        ) : (
          <p className="small">No messages yet.</p>
        )}
      </div>

      <div className="meeting-chat-input">
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!text.trim()) return;
              onSend(text.trim());
              setText("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            onSend(text.trim());
            setText("");
          }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}
