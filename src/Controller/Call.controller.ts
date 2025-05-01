import { Server, Socket } from 'socket.io';

export default function handleCallSocket(io: Server, socket: Socket) {
  console.log(`📞 Call Socket Connected: ${socket.id}`);

  // ✅ 1. User joins a room (chatId)
  socket.on('join-call-room', (chatId: string) => {
    socket.join(chatId);
    console.log(`👥 User joined call room: ${chatId}`);
  });

  // ✅ 2. Start call - Caller sends offer
  socket.on('start-call', ({ chatId, offer, caller }) => {
    console.log('📞 Start Call from:', caller.userId);

    socket.to(chatId).emit('call-offer', { offer, caller });
  });

  // ✅ 3. Answer call - Receiver sends answer
  socket.on('answer-call', ({ chatId, answer, receiver }) => {
    console.log('✅ Call Answered by:', receiver.userId);

    socket.to(chatId).emit('call-answer', { answer, receiver });
  });

  // ✅ 4. ICE Candidate Exchange
  socket.on('ice-candidate', ({ chatId, candidate }) => {
    console.log('🧊 ICE Candidate received for chatId:', chatId);

    socket.to(chatId).emit('ice-candidate', { candidate });
  });

  // ✅ 5. Call End
  socket.on('end-call', ({ chatId }) => {
    console.log('❌ Call Ended for chatId:', chatId);

    socket.to(chatId).emit('call-ended');
  });

  // ✅ 6. User disconnected
  socket.on('disconnect', () => {
    console.log(`❌ Call Socket Disconnected: ${socket.id}`);
  });
}
