import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || undefined;

const socket = io(URL, {
  path: '/socket.io',
  autoConnect: true,
  withCredentials: true,
});

export default socket;
