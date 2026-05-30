import { io } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.79.138.49:5000/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

class LocationSocket {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.tripId = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected for live tracking');
      if (this.userId) {
        this.socket.emit('join_tracking', { userId: this.userId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
    this.tripId = null;
  }

  joinTracking(userId, tripId) {
    this.userId = userId?.toString();
    this.tripId = tripId?.toString();

    const join = () => {
      if (this.socket?.connected && this.userId) {
        this.socket.emit('join_tracking', { userId: this.userId });
      }
    };

    if (!this.socket) this.connect();
    if (this.socket.connected) join();
    else this.socket.once('connect', join);
  }

  sendLocationUpdate(lat, lng) {
    if (!this.socket?.connected || !this.userId || !this.tripId) return;

    this.socket.emit('location_update', {
      userId: this.userId,
      tripId: this.tripId,
      lat,
      lng,
    });
  }

  endTracking() {
    this.tripId = null;
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }
}

const locationSocket = new LocationSocket();
export default locationSocket;
