import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore.js";
import useChatStore from "../store/chatStore.js";
import { getRooms, createRoom, getRoomMessages, getDMs, getOrCreateDM } from "../api/room.api.js";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getRooms().then((res) => setRooms(res.data.data.rooms));
    getDMs().then((res) => setDMs(res.data.data.dms));
  }, []);

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
    if (activeRoom) socket.emit("leave_room", { roomId: activeRoom._id });
    setActiveRoom(room);
    setLoadingMessages(true);
    setSidebarOpen(false); // close sidebar on mobile after selecting room

    try {
      const res = await getRoomMessages(room._id);
      setMessages(res.data.data.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }

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
      setDMs((prev) =>
        prev.find((d) => d._id === dm._id) ? prev : [...prev, dm]
      );
      handleSelectRoom(dm);
    } catch (err) {
      alert(err.response?.data?.message || "Could not start DM");
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">

      {/* Mobile overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:flex
      `}>
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
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden h-14 border-b border-zinc-800 px-4 flex items-center gap-3 bg-zinc-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-zinc-300">
            {activeRoom
              ? activeRoom.type === "dm"
                ? activeRoom.participants?.find(p => p._id !== user?.id && p._id !== user?._id)?.name || "DM"
                : activeRoom.name
              : "OptimusChat"
            }
          </span>
        </div>

        {/* Chat + Members */}
        <div className="flex-1 flex min-h-0">
          <ChatArea
            user={user}
            activeRoom={activeRoom}
            messages={messages}
            loading={loadingMessages}
          />
          {/* Members panel — hidden on mobile */}
          <div className="hidden lg:block">
            <MembersList activeRoom={activeRoom} />
          </div>
        </div>
      </div>
    </div>
  );
}