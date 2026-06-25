import { useState, useEffect, useRef } from "react";
import { getSocket } from "../../utils/socket.js";
import useChatStore from "../../store/chatStore.js";

export default function ChatArea({ user, activeRoom, messages, loading, onBrowseRooms, onBrowseDMs }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const { typingUsers } = useChatStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    const socket = getSocket();
    socket.emit("send_message", { roomId: activeRoom._id, content: text.trim() });
    setText("");
    socket.emit("stop_typing", { roomId: activeRoom._id });
    setIsTyping(false);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeRoom) return;
    const socket = getSocket();
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { roomId: activeRoom._id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop_typing", { roomId: activeRoom._id });
    }, 2000);
  };

  const roomTyping = activeRoom ? typingUsers[activeRoom._id] || {} : {};
  const typingNames = Object.entries(roomTyping)
    .filter(([uid]) => uid !== (user?.id || user?._id))
    .map(([, name]) => name);

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getRoomTitle = () => {
    if (!activeRoom) return "";
    if (activeRoom.type === "dm") {
      const other = activeRoom.participants?.find(
        (p) => p._id !== user?.id && p._id !== user?._id
      );
      return other?.name || "Unknown";
    }
    return activeRoom.name;
  };

if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-black font-bold text-xs">OC</span>
            </div>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">
            Welcome to OptimusChat
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            Select a room from the sidebar to start chatting, or open a Direct Message to talk privately.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <button
              onClick={onBrowseRooms}
              className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 rounded-xl p-4 text-left transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-3" />
              <p className="text-sm font-medium text-zinc-300 group-hover:text-white mb-0.5">
                Public Rooms
              </p>
              <p className="text-xs text-zinc-500">Chat with everyone</p>
            </button>
            <button
              onClick={onBrowseDMs}
              className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 rounded-xl p-4 text-left transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block mb-3" />
              <p className="text-sm font-medium text-zinc-300 group-hover:text-white mb-0.5">
                Direct Messages
              </p>
              <p className="text-xs text-zinc-500">Private conversations</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 px-5 flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          activeRoom.type === "dm" ? "bg-zinc-500" : "bg-emerald-500"
        }`} />
        <h2 className="font-semibold text-white">{getRoomTitle()}</h2>
        {activeRoom.type === "room" && (
          <span className="text-xs text-zinc-500 ml-1">Public room</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {loading && (
          <p className="text-zinc-600 text-sm text-center py-8">Loading messages...</p>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">
              No messages yet — say hello!
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.sender?._id === user?.id || msg.sender?._id === user?._id;
          const showMeta = i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id;

          return (
            <div key={msg._id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {showMeta ? (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium text-zinc-300">
                  {msg.sender?.name?.[0]?.toUpperCase() || "?"}
                </div>
              ) : (
                <div className="w-8 flex-shrink-0" />
              )}
              <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {showMeta && (
                  <span className="text-xs text-zinc-500 mb-1 px-1">
                    {isOwn ? "You" : msg.sender?.name} · {formatTime(msg.createdAt)}
                  </span>
                )}
                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? "bg-emerald-500 text-black rounded-tr-sm font-medium"
                    : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 pl-11">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">
              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            value={text}
            onChange={handleTyping}
            placeholder={`Message ${activeRoom.type === "dm" ? getRoomTitle() : activeRoom.name}...`}            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}