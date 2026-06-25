import useChatStore from "../../store/chatStore.js";

export default function MembersList({ activeRoom }) {
  const { onlineUsers } = useChatStore();

  if (!activeRoom) return (
    <div className="w-52 flex-shrink-0 bg-zinc-900 border-l border-zinc-800" />
  );

  const members = activeRoom.type === "dm"
    ? activeRoom.participants || []
    : [];

  return (
    <div className="w-52 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          {activeRoom.type === "dm" ? "Participants" : "Online"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeRoom.type === "dm" ? (
          <div className="space-y-1">
            {members.map((member) => {
              const isOnline = onlineUsers.includes(member._id);
              return (
                <div key={member._id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-zinc-300">
                        {member.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${
                      isOnline ? "bg-emerald-500" : "bg-zinc-600"
                    }`} />
                  </div>
                  <span className="text-sm text-zinc-300 truncate">{member.name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-zinc-600 px-2">
              {onlineUsers.length} online
            </p>
          </div>
        )}
      </div>
    </div>
  );
}