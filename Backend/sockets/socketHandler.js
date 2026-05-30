import Trip from '../models/Trip.js';
import ChatMessage from '../models/ChatMessage.js';

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on('join_tracking', ({ userId }) => {
      socket.join(userId);
      console.log(`User ${userId} joined tracking room.`);
    });

    socket.on('join_chat', ({ userId }) => {
      if (userId) {
        socket.join(`chat_${userId}`);
        console.log(`Socket joined chat room: chat_${userId}`);
      }
    });

    socket.on('admin_monitor', () => {
      socket.join('admin_room');
      console.log(`Admin ${socket.id} joined monitoring room.`);
    });

    socket.on('location_update', async (data) => {
      const { userId, tripId, lat, lng } = data;

      try {
        io.to('admin_room').emit('receive_location', {
          userId,
          lat,
          lng,
          tripId,
          timestamp: new Date()
        });

        if (tripId) {
          await Trip.findByIdAndUpdate(tripId, {
            $push: { path: { lat, lng, timestamp: new Date() } }
          });
        }
      } catch (err) {
        console.error('Socket Location Error:', err);
      }
    });

    socket.on('chat_message', async (data) => {
      const { userId, text } = data;
      if (!userId || !text?.trim()) return;

      try {
        const saved = await ChatMessage.create({
          userId,
          sender: 'employee',
          text: text.trim()
        });

        const msg = {
          text: saved.text,
          sender: 'employee',
          userId: userId.toString(),
          timestamp: saved.timestamp
        };

        io.to('admin_room').emit('chat_message', msg);
        io.to(`chat_${userId}`).emit('chat_message', msg);
      } catch (err) {
        console.error('Chat message error:', err);
      }
    });

    socket.on('admin_message', async (data) => {
      const { userId, text } = data;
      if (!userId || !text?.trim()) return;

      try {
        const saved = await ChatMessage.create({
          userId,
          sender: 'admin',
          text: text.trim()
        });

        const msg = {
          text: saved.text,
          sender: 'admin',
          userId: userId.toString(),
          timestamp: saved.timestamp
        };

        io.to(`chat_${userId}`).emit('chat_message', msg);
        io.to('admin_room').emit('chat_message', msg);
      } catch (err) {
        console.error('Admin message error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

export default socketHandler;
