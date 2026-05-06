import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
  autoConnect: true,
  ackTimeout: 10000,
  retries: 3,
});

export default socket;
