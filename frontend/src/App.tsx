import { useState, useEffect } from "react";
import { io } from "socket.io-client";

// ✅ لازم نفس بورت السيرفر
const socket = io("http://localhost:8000");

type ChatMessage = {
  userId: string;
  message: string;
};

function App() {
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // ✅ create room
  const createRoom = () => {
    socket.emit("createRoom");
  };

  // ✅ join room
  const joinRoom = () => {
    if (!room) return alert("Enter room ID");
    socket.emit("joinRoom", { roomId: room });
  };

  // ✅ send message
  const sendMessage = () => {
    if (!message) return;
    socket.emit("sendMessage", { roomId: room, message });
    setMessage("");
  };

  useEffect(() => {
    socket.on("roomCreated", (data) => {
      console.log("[Socket] Room created:", data.roomId);
      setRoom(data.roomId);
    });

    socket.on("joinedRoom", (data) => {
      console.log("[Socket] Joined room:", data.roomId);
    });

    socket.on("newMessage", (data) => {
      setChat((prev) => [
        ...prev,
        { userId: data.userId, message: data.message },
      ]);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("newMessage");
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chat App</h1>

      {/* 🟢 Create Room */}
      <button onClick={createRoom}>Create Room</button>

      <p>
        <b>Room ID:</b> {room}
      </p>

      {/* 🟢 Join Room */}
      <input
        placeholder="Enter Room ID"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>

      <hr />

      {/* 🟢 Chat */}
      <input
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>

      <div style={{ marginTop: "20px" }}>
        {chat.map((msg, i) => (
          <p key={i}>
            <b>{msg.userId.slice(0, 5)}:</b> {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
