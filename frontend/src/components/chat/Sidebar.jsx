import { useState, useEffect } from "react";
import { searchUsers, getUsers } from "../../api/user.api.js";
import useChatStore from "../../store/chatStore.js";

export default function Sidebar({
  user,
  rooms,
  dms,
  activeRoom,
  onSelectRoom,
  onCreateRoom,
  onStartDM,
  onLogout,
}) {
  const [newRoomName, setNewRoomName] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const { onlineUsers, unreadCounts } = useChatStore();

  useEffect(() => {
    getUsers()
      .then((res) => {
        // ✅ FIX 1: apna user filter out karo
        const others = res.data.data.users.filter(
          (u) => u._id !== user?.id && u._id !== user?._id,
        );
        setAllUsers(others);
      })
      .catch(() => {});
  }, [user]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim());
    setNewRoomName("");
    setShowCreateRoom(false);
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchUsers(q);
      // apna user search results se bhi hatao
      const others = res.data.data.users.filter(
        (u) => u._id !== user?.id && u._id !== user?._id,
      );
      setSearchResults(others);
    } catch {
      setSearchResults([]);
    }
  };

  const handleStartDM = (userId) => {
    onStartDM(userId);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getDMName = (dm) => {
    const other = dm.participants?.find(
      (p) => p._id !== user?.id && p._id !== user?._id,
    );
    return other?.name || "Unknown";
  };

  const getDMOnline = (dm) => {
    const other = dm.participants?.find(
      (p) => p._id !== user?.id && p._id !== user?._id,
    );
    return other ? onlineUsers.includes(other._id) : false;
  };

  return (
    <div className="w-64 flex-shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800">
      {/* App header */}
      <div className="h-14 px-4 flex items-center border-b border-zinc-800 gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-xs">OC</span>
        </div>
        <span className="font-semibold text-white text-sm">OptimusChat</span>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Rooms section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Rooms
            </span>
            <button
              onClick={() => {
                setShowCreateRoom(!showCreateRoom);
                setShowSearch(false);
              }}
              className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors text-base leading-none"
              title="Create room"
            >
              +
            </button>
          </div>

          {showCreateRoom && (
            <form onSubmit={handleCreateRoom} className="px-2 mb-2">
              <input
                autoFocus
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </form>
          )}

          <div className="space-y-0.5">
            {rooms.length === 0 && (
              <p className="text-xs text-zinc-600 px-2 py-1">No rooms yet</p>
            )}
            {rooms.map((room) => {
              const isActive = activeRoom?._id === room._id;
              const unread = unreadCounts?.[room._id] || 0;
              return (
                <button
                  key={room._id}
                  onClick={() => onSelectRoom(room)}
                  className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  <span className="flex-1 truncate">{room.name}</span>
                  {/* ✅ FIX 2: Unread badge */}
                  {!isActive && unread > 0 && (
                    <span className="bg-emerald-500 text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Direct Messages
            </span>
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setShowCreateRoom(false);
              }}
              className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors text-base leading-none"
              title="New DM"
            >
              +
            </button>
          </div>

          {showSearch && (
            <div className="px-2 mb-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchResults.length > 0 && (
                <div className="mt-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleStartDM(u._id)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-zinc-600 mt-1 px-1">
                  No users found
                </p>
              )}
            </div>
          )}

          <div className="space-y-0.5">
            {dms.length === 0 && (
              <p className="text-xs text-zinc-600 px-2 py-1">No DMs yet</p>
            )}
            {dms.map((dm) => {
              const isActive = activeRoom?._id === dm._id;
              const isOnline = getDMOnline(dm);
              const unread = unreadCounts?.[dm._id] || 0;
              return (
                <button
                  key={dm._id}
                  onClick={() => onSelectRoom(dm)}
                  className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isOnline ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  <span className="flex-1 truncate">{getDMName(dm)}</span>
                  {/* ✅ FIX 2: Unread badge DMs ke liye */}
                  {!isActive && unread > 0 && (
                    <span className="bg-emerald-500 text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* People section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              People
            </span>
          </div>
          <div className="space-y-0.5">
            {allUsers.length === 0 && (
              <p className="text-xs text-zinc-600 px-2 py-1">
                No other users yet
              </p>
            )}
            {allUsers.map((u) => {
              const isOnline = onlineUsers.includes(u._id);
              return (
                // ✅ button → div, onClick hatao
                <div
                  key={u._id}
                  className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-zinc-400"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isOnline ? "bg-emerald-400" : "bg-zinc-600"
                    }`}
                  />
                  {u.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="h-14 px-3 border-t border-zinc-800 flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {user?.name}
          </p>
          <p className="text-xs text-emerald-500">Online</p>
        </div>
        <button
          onClick={onLogout}
          className="flex-shrink-0 px-2 py-1 text-xs text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
