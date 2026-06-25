import apiClient from "./client.js";

export const getRooms = () => apiClient.get("/rooms");
export const createRoom = (data) => apiClient.post("/rooms", data);
export const getRoomMessages = (roomId, page = 1) =>
  apiClient.get(`/rooms/${roomId}/messages?page=${page}&limit=30`);
export const getDMs = () => apiClient.get("/dms");
export const getOrCreateDM = (userId) => apiClient.post(`/dms/${userId}`);