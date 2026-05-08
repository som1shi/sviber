import { io } from 'socket.io-client';

/** In dev, omit URL so we hit the Vite dev server; proxy forwards `/socket.io` to the API. */
const URL = import.meta.env.VITE_API_URL || undefined;

const socket = io(URL, {
  path: '/socket.io',
  autoConnect: true,
  withCredentials: true,
});

export default socket;
