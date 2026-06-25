import apiClient from "./client.js";

export const searchUsers = (q) => apiClient.get(`/users/search?q=${q}`);
export const getUsers = () => apiClient.get("/users");