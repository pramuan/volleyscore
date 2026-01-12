import io from 'socket.io-client';

// Auto-detect server URL: use window.location.hostname but port 3000
// This works if client is on 5173 and server on 3000 on same machine
const SERVER_URL = `http://${window.location.hostname}:3000`;

export const socket = io(SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
