import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect } from 'mongoose';
import { sequelize } from './Config/Database.config';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './Routes/Auth.routes';
import userRoutes from './Routes/UserRoutes.routes';
import postRoutes from './Routes/Post.routes';
import webhookRoutes from './Routes/Webhook.routes';
import storyRoutes from './Routes/Story.routes';
import AnonymousNameRoutes from './Routes/AnonymousName.routes';
import callRoutes from './Routes/Call.routes';
import cron from 'node-cron';
import { syncClerkUsers } from './Controller/User.controller';
import KanbanCardRoutes from './Routes/Kanban.routes';
import chatRoutes from './Routes/Chat.routes';
import avatarRoutes from './Routes/Avatar.routes';
import notificationRoutes from './Routes/Notification.routes';
import Chat from './Models/Chat.model';
import couponRoutes from './Routes/Coupon.routes';
import VibeCardRoutes from './Routes/VibeCard.routes';
import RandomChatRoutes from './Routes/RandomChat.routes';
import QnaCard from './Routes/QnaCard.routes';
import SupportSystem from './Routes/Support.routes';
import AdminControl from './Routes/Admin.routes';
import handleChatSocket from './Controller/Chat.controller';
import handleCallSocket from './Controller/Call.controller';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});
// console.log("🧪 Loaded ADMIN_USER_IDS:", process.env.ADMIN_USER_IDS);

console.log('🟢 Express & WebSocket Server Initialized');

// ✅ Global Middleware Setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('🟢 Middleware Applied');

// ✅ Function to update old chat records
const updateChats = async () => {
  try {
    console.log('🔄 Checking for old chats that need `isAccepted` field...');
    const result = await Chat.updateMany({}, { $set: { isAccepted: false } });
    console.log(`✅ Updated ${result.modifiedCount} chat records.`);
  } catch (error) {
    console.error('❌ Error updating chat records:', error);
  }
};

// ✅ MongoDB Connection
const mongoURI = process.env.mongoURI;
connect(mongoURI)
  .then(async () => {
    console.log('✅ Server connected to MongoDB');
    await updateChats(); // ✅ Run update when server starts
  })
  .catch(error => console.error('❌ Failed to connect to MongoDB:', error));

// ✅ Schedule a cron job to sync Clerk users every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log('🔄 Running scheduled Clerk user sync...');
  try {
    await syncClerkUsers();
    console.log('✅ Clerk users synced successfully!');
  } catch (error) {
    console.error('❌ Error syncing Clerk users:', error);
  }
});

// ✅ Attach Socket.io to Express Request
app.use((req, res, next) => {
  (req as any).io = io; // ✅ Inject io into requests
  next();
});

// ✅ WebSocket Connection Handling
io.on('connection', socket => {
  handleChatSocket(io, socket); // ✅ For normal chat
  handleCallSocket(io, socket); // ✅ For voice/video call
});

// ✅ Load Routes After Sequelize Authentication
sequelize
  .authenticate()
  .then(async () => {
    console.log('✅ Sequelize connected & models registered');

    // Optionally, log all registered models to verify
    console.log(
      '🔍 Registered Models:',
      sequelize.modelManager.models.map(m => m.name),
    );

    // ✅ Only now load your routes
    console.log('🔹 Loading Routes...');
    app.use(authRoutes);
    app.use(userRoutes);
    app.use(postRoutes);
    app.use(webhookRoutes);
    app.use(storyRoutes);
    app.use(AnonymousNameRoutes);
    app.use(KanbanCardRoutes);
    app.use(chatRoutes);
    app.use(avatarRoutes);
    app.use(notificationRoutes);
    app.use(VibeCardRoutes);
    app.use(couponRoutes);
    app.use(RandomChatRoutes);
    app.use(QnaCard);
    app.use(SupportSystem);
    app.use(AdminControl);
    app.use(callRoutes);

    // ✅ Root Route
    app.get('/', (_req, res) => {
      res.send('🚀 Clerk Authentication Server Running!');
    });

    // ✅ Start Server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Sequelize connection error:', err);
  });
