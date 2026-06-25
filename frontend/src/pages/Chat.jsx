import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore.js";
import useChatStore from "../store/chatStore.js";
import { getRooms, createRoom, getRoomMessages, getDMs, getOrCreateDM } from "../api/room.api.js";
import { searchUsers } from "../api/user.api.js";
import { getSocket } from "../utils/socket.js";
import Sidebar from "../components/chat/Sidebar.jsx";
import ChatArea from "../components/chat/ChatArea.jsx";
import MembersList from "../components/chat/MembersList.jsx";

export default function Chat() {
  const { user, logout } = useAuthStore();
  const {
    rooms, dms, activeRoom, messages,
    setRooms, setDMs, setActiveRoom, setMessages,
    addMessage, setOnlineUsers, addOnlineUser,
    removeOnlineUser, setTyping, clearTyping,
  } = useChatStore();

  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load rooms and DMs on mount
  useEffect(() => {
    getRooms().then((res) => setRooms(res.data.data.rooms));
    getDMs().then((res) => setDMs(res.data.data.dms));
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("online_users", (users) => setOnlineUsers(users));
    socket.on("user_online", ({ userId }) => addOnlineUser(userId));
    socket.on("user_offline", ({ userId }) => removeOnlineUser(userId));

    socket.on("receive_message", (message) => {
      if (activeRoom && message.room === activeRoom._id) {
        addMessage(message);
      }
    });

    socket.on("typing", ({ userId, name, roomId }) => {
      if (activeRoom?._id === roomId) setTyping(roomId, userId, name);
    });

    socket.on("stop_typing", ({ userId, roomId }) => {
      if (activeRoom?._id === roomId) clearTyping(roomId, userId);
    });

    return () => {
      socket.off("online_users");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [activeRoom]);

  const handleSelectRoom = async (room) => {
    const socket = getSocket();

    // Leave previous room
    if (activeRoom) socket.emit("leave_room", { roomId: activeRoom._id });

    setActiveRoom(room);
    setLoadingMessages(true);

    try {
      const res = await getRoomMessages(room._id);
      setMessages(res.data.data.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }

    // Join new room via socket
    socket.emit("join_room", { roomId: room._id });
  };

  const handleCreateRoom = async (name) => {
    try {
      const res = await createRoom({ name });
      const newRoom = res.data.data.room;
      setRooms([...rooms, newRoom]);
      handleSelectRoom(newRoom);
    } catch (err) {
      alert(err.response?.data?.message || "Could not create room");
    }
  };

  const handleStartDM = async (userId) => {
    try {
      const res = await getOrCreateDM(userId);
      const dm = res.data.data.room;
      // Add to DMs list if not already there
      setDMs((prev) =>
        prev.find((d) => d._id === dm._id) ? prev : [...prev, dm]
      );
      handleSelectRoom(dm);
    } catch (err) {
      alert(err.response?.data?.message || "Could not start DM");
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar
        user={user}
        rooms={rooms}
        dms={dms}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        onStartDM={handleStartDM}
        onLogout={logout}
      />
      <ChatArea
        user={user}
        activeRoom={activeRoom}
        messages={messages}
        loading={loadingMessages}
      />
      <MembersList
        activeRoom={activeRoom}
        rooms={rooms}
        dms={dms}
      />
    </div>
  );
}