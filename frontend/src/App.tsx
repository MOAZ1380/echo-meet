import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const createRoom = () => {
    const newRoom = generateRoomId();
    setRoom(newRoom);
    socket.emit("joinRoom", newRoom);
  };

  const joinRoom = () => {
    socket.emit("joinRoom", room);
  };

  const sendMessage = () => {
    socket.emit("sendMessage", { roomId: room, message });
  };

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  return (
    <div>
      <h1>Chat App</h1>

      <button onClick={createRoom}>Create Room</button>

      <p>Room ID: {room}</p>

      <input
        placeholder="Enter Room ID"
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>

      <br />

      <input
        placeholder="Message"
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>

      <div>
        {chat.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default App;
