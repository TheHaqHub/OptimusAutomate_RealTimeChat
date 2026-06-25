import { create } from "zustand";

const useChatStore = create((set, get) => ({
  rooms: [],
  dms: [],
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  unreadCounts: {},

  setRooms: (rooms) => set({ rooms }),
  setDMs: (dms) => set({ dms }),

  setActiveRoom: (room) =>
    set((state) => ({
      activeRoom: room,
      messages: [],
      unreadCounts: { ...state.unreadCounts, [room._id]: 0 },
    })),

  setMessages: (messages) => set({ messages }),

  // ✅ Background room ka message — count badhao, active room ka — array mein add karo
  addMessage: (message) =>
    set((state) => {
      const isActive = state.activeRoom?._id === message.room;
      const prevCount = state.unreadCounts[message.room] || 0;

      return {
        // Active room ka message array mein, warna array same rahega
        messages: isActive
          ? [...state.messages, message]
          : state.messages,
        // Background room ka unread count badhao
        unreadCounts: isActive
          ? state.unreadCounts
          : { ...state.unreadCounts, [message.room]: prevCount + 1 },
      };
    }),

  clearUnread: (roomId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
    })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId],
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),

  setTyping: (roomId, userId, name) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [roomId]: { ...state.typingUsers[roomId], [userId]: name },
      },
    })),

  clearTyping: (roomId, userId) =>
    set((state) => {
      const roomTyping = { ...state.typingUsers[roomId] };
      delete roomTyping[userId];
      return {
        typingUsers: { ...state.typingUsers, [roomId]: roomTyping },
      };
    }),
}));

export default useChatStore;