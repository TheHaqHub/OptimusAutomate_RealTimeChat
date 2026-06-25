import { useEffect, useState, useRef } from "react";
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
    addMessage, clearUnread, setOnlineUsers, addOnlineUser,
    removeOnlineUser, setTyping, clearTyping,
  } = useChatStore();

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusDM, setFocusDM] = useState(false);

  const activeRoomRef = useRef(activeRoom);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    const socket = getSocket();

    // ✅ Rooms fetch + auto-join
    getRooms().then((res) => {
      const fetchedRooms = res.data.data.rooms;
      setRooms(fetchedRooms);
      // Saare public rooms background join
      fetchedRooms.forEach((room) => {
        socket.emit("join_room", { roomId: room._id });
      });
    });

    // ✅ DMs fetch + auto-join
    getDMs().then((res) => {
      const fetchedDMs = res.data.data.dms;
      setDMs(fetchedDMs);
      // Saare DMs background join
      fetchedDMs.forEach((dm) => {
        socket.emit("join_room", { roomId: dm._id });
      });
    });
  }, []);

  // ✅ Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("online_users", (users) => setOnlineUsers(users));
    socket.on("user_online", ({ userId }) => addOnlineUser(userId));
    socket.on("user_offline", ({ userId }) => removeOnlineUser(userId));

    socket.on("receive_message", (message) => {
      const current = activeRoomRef.current;
      // ✅ Hamesha addMessage karo — chatStore khud decide karega unread badhana ya nahi
      addMessage(message);

      // ✅ Browser notification — sirf background room ka
      if (!current || message.room !== current._id) {
        if (Notification.permission === "granted") {
          new Notification(`💬 ${message.sender?.name}`, {
            body: message.content,
            icon: "/favicon.ico",
          });
        }
      }
    });

    socket.on("typing", ({ userId, name, roomId }) => {
      const current = activeRoomRef.current;
      if (current?._id === roomId) setTyping(roomId, userId, name);
    });

    socket.on("stop_typing", ({ userId, roomId }) => {
      const current = activeRoomRef.current;
      if (current?._id === roomId) clearTyping(roomId, userId);
    });

    // ✅ Browser notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      socket.off("online_users");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

const handleSelectRoom = async (room) => {
    const socket = getSocket();

    // ✅ Koi bhi room leave mat karo — sab background join rehne do
    // (remove karo pehle wala leave_room logic)

    setActiveRoom(room);
    clearUnread(room._id);
    setLoadingMessages(true);
    setSidebarOpen(false);

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
      // ✅ Naya DM bhi auto-join karo
      const socket = getSocket();
      socket.emit("join_room", { roomId: dm._id });
      setDMs((prev) =>
        prev.find((d) => d._id === dm._id) ? prev : [...prev, dm]
      );
      handleSelectRoom(dm);
    } catch (err) {
      alert(err.response?.data?.message || "Could not start DM");
    }
  };

  const handleBrowseRooms = () => {
    setSidebarOpen(true);
    setFocusDM(false);
    if (rooms.length > 0) handleSelectRoom(rooms[0]);
  };

  const handleBrowseDMs = () => {
    setSidebarOpen(true);
    setFocusDM(true);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 h-full
        transform transition-transform duration-250 ease-in-out
        lg:relative lg:translate-x-0 lg:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
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
          focusDM={focusDM}
          onFocusDMDone={() => setFocusDM(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <div className="lg:hidden h-14 border-b border-zinc-800 px-4 flex items-center gap-3 bg-zinc-900 flex-shrink-0">
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
                ? activeRoom.participants?.find(
                    (p) => p._id !== user?.id && p._id !== user?._id
                  )?.name || "DM"
                : activeRoom.name
              : "OptimusChat"}
          </span>
        </div>

        <div className="flex-1 flex min-h-0">
          <ChatArea
            user={user}
            activeRoom={activeRoom}
            messages={messages}
            loading={loadingMessages}
            onBrowseRooms={handleBrowseRooms}
            onBrowseDMs={handleBrowseDMs}
          />
          <div className="hidden lg:block">
            <MembersList activeRoom={activeRoom} />
          </div>
        </div>
      </div>
    </div>
  );
}