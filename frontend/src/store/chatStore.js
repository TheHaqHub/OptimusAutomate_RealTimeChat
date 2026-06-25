import { create } from "zustand";

const useChatStore = create((set, get) => ({
  rooms: [],
  dms: [],
  activeRoom: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},

  setRooms: (rooms) => set({ rooms }),
  setDMs: (dms) => set({ dms }),

  setActiveRoom: (room) => set({ activeRoom: room, messages: [] }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

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