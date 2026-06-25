import { create } from "zustand";
import { loginUser, registerUser, getCurrentUser } from "../api/auth.api.js";
import { connectSocket, disconnectSocket } from "../utils/socket.js";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await getCurrentUser();
      const user = res.data.data.user;
      set({ user, token, loading: false });
      connectSocket(token);
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (credentials) => {
    const res = await loginUser(credentials);
    const { user, token } = res.data.data;
    localStorage.setItem("token", token);
    set({ user, token });
    connectSocket(token);
    return user;
  },

  register: async (details) => {
    const res = await registerUser(details);
    const { user, token } = res.data.data;
    localStorage.setItem("token", token);
    set({ user, token });
    connectSocket(token);
    return user;
  },

  logout: () => {
    localStorage.removeItem("token");
    disconnectSocket();
    set({ user: null, token: null });
  },
}));

export default useAuthStore;