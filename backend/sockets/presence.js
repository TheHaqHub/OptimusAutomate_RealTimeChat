// In-memory presence store
// Map<userId(string), Set<socketId(string)>>
const onlineUsers = new Map();

export const addUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);
};

export const removeUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return false;

  const sockets = onlineUsers.get(userId);
  sockets.delete(socketId);

  // Only truly offline when ALL tabs/devices disconnect
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true; // user is now fully offline
  }

  return false; // still has other sockets open
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};