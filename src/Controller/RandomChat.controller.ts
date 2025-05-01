import { Response } from 'express';
import { MyRequest } from '../Interfaces/Request.interface';
import { Op, Transaction, TimeoutError } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import WaitingUser from '../Models/WaitingUser.model';
import Chat from '../Models/Chat.model';
import RandomChat from '../Models/RandomChat.model';
import User from '../Models/User.model';
import RandomMessage from '../Models/RandomMessages.model';
import { sequelize } from '../Config/Database.config';

dotenv.config();
const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

// Constants for queue management
const QUEUE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_WAIT_TIME_MS = 10 * 60 * 1000; // 10 minutes

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const withRetry = async (operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await operation();
  } catch (error) {
    if (
      retries > 0 &&
      (error instanceof TimeoutError || error.name === 'ConnectionAcquireTimeoutError' || error.name === 'SequelizeConnectionError')
    ) {
      console.log(`⚠️ Operation failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

const cleanupUserChats = async (userId: string, transaction: Transaction) => {
  console.log(`🧹 Cleaning up active chats for user ${userId}`);

  // Find all active chats for the user
  const activeChats = await RandomChat.findAll({
    where: {
      [Op.or]: [{ user1: userId }, { user2: userId }],
      isAccepted: true,
    },
    transaction,
    lock: true,
  });

  if (activeChats.length > 0) {
    console.log(`⚠️ Found ${activeChats.length} active chats for user ${userId}`);

    // End all active chats
    await RandomChat.update(
      { isAccepted: false },
      {
        where: {
          id: {
            [Op.in]: activeChats.map(chat => chat.id),
          },
        },
        transaction,
      },
    );

    console.log(`✅ Ended ${activeChats.length} active chats for user ${userId}`);
  }

  return activeChats.length;
};

export const findRandomMatch = async (req: MyRequest, res: Response) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decodedToken.userId;
    const { interest } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    console.log(`🔍 User ${userId} requesting match with interest: ${interest || 'none'}`);

    // First check if user is already in an active chat
    const activeChat = await RandomChat.findOne({
      where: {
        [Op.or]: [{ user1: userId }, { user2: userId }],
        isAccepted: true,
      },
      transaction,
      lock: true,
    });

    if (activeChat) {
      console.log(`⚠️ User ${userId} is already in an active chat ${activeChat.id}`);
      await transaction.commit();
      return res.status(200).json({
        matched: true,
        chatId: activeChat.id,
        partnerId: activeChat.user1 === userId ? activeChat.user2 : activeChat.user1,
        message: 'Already in an active chat',
      });
    }

    // Then cleanup any existing active chats
    const cleanedChats = await cleanupUserChats(userId, transaction);
    if (cleanedChats > 0) {
      console.log(`ℹ️ Cleaned up ${cleanedChats} active chats before finding new match`);
    }

    // Check if user is already in queue
    const queuedUser = await WaitingUser.findOne({
      where: { userId },
      transaction,
      lock: true,
    });

    if (queuedUser) {
      console.log(`⚠️ User ${userId} is already in queue, checking for matches...`);

      // Update user's interest if provided
      if (interest) {
        await WaitingUser.update(
          { interest },
          {
            where: { userId },
            transaction,
          },
        );
        console.log(`📝 Updated user ${userId}'s interest to: ${interest}`);
      }

      // Log all users in queue for debugging
      const allQueuedUsers = await WaitingUser.findAll({
        where: { userId: { [Op.ne]: userId } },
        transaction,
      });
      console.log(`📊 Current queue status: ${allQueuedUsers.length} other users in queue`);
      allQueuedUsers.forEach(user => {
        console.log(`   - User ${user.userId} with interest: ${user.interest}`);
      });

      // Try to find a matching partner with flexible matching
      let partner = null;

      // First try to find any user who has been waiting longer than QUEUE_TIMEOUT_MS
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          createdAt: {
            [Op.lt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: true,
      });

      if (partner) {
        console.log(`⏰ Found user ${partner.userId} who has been waiting too long`);
      } else {
        // If no user waiting too long, try interest matching
        if (interest) {
          console.log(`🔎 Searching for users with interest: ${interest}`);

          // 1. Try exact interest match
          partner = await WaitingUser.findOne({
            where: {
              userId: { [Op.ne]: userId },
              interest: {
                [Op.or]: [
                  interest, // Exact match
                  { [Op.like]: `%${interest}%` }, // Contains interest
                  { [Op.like]: `${interest}%` }, // Starts with interest
                  { [Op.like]: `%${interest}` }, // Ends with interest
                ],
              },
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: true,
          });

          if (partner) {
            console.log(`🎯 Found interest match with user ${partner.userId} (${partner.interest})`);
          } else {
            console.log(`❌ No interest match found for interest: ${interest}`);
          }
        } else {
          // If no interest specified, try to match with any user who has been waiting
          partner = await WaitingUser.findOne({
            where: {
              userId: { [Op.ne]: userId },
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: true,
          });

          if (partner) {
            console.log(`🎯 Found general match with user ${partner.userId}`);
          } else {
            console.log(`❌ No general match found`);
          }
        }
      }

      if (partner) {
        const chatId = uuidv4();
        console.log(`✨ Creating chat ${chatId} between users ${userId} and ${partner.userId}`);

        const newChat = await RandomChat.create(
          {
            id: chatId,
            user1: partner.userId,
            user2: userId,
            interest: interest || partner.interest,
            type: 'random',
            isAccepted: true,
          },
          { transaction },
        );

        // Remove both users from queue
        await WaitingUser.destroy({
          where: { userId: partner.userId },
          transaction,
        });
        console.log(`✅ Removed user ${partner.userId} from queue`);

        await WaitingUser.destroy({
          where: { userId },
          transaction,
        });
        console.log(`✅ Removed user ${userId} from queue`);

        await transaction.commit();

        return res.status(200).json({
          matched: true,
          chatId: newChat.id,
          partnerId: partner.userId,
          message: 'Match found',
        });
      }

      // No match found, return queue status
      console.log(`⏳ No match found for user ${userId}, staying in queue`);
      await transaction.commit();
      return res.status(200).json({
        message: 'Already in queue, waiting for match',
        queued: true,
        waitTime: Math.floor((Date.now() - queuedUser.createdAt.getTime()) / 1000),
      });
    }

    // Try to find a matching partner with flexible matching
    let partner = null;

    // 1. Try exact interest match if interest provided
    if (interest) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          interest,
          createdAt: {
            [Op.gt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
      });
    }

    // 2. Try partial interest match if no exact match
    if (!partner && interest) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          interest: {
            [Op.like]: `%${interest}%`,
          },
          createdAt: {
            [Op.gt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
      });
    }

    // 3. Fallback to any user waiting too long
    if (!partner) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          createdAt: {
            [Op.lt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
      });
    }

    if (partner) {
      const chatId = uuidv4();
      console.log(`🎯 Match found: User ${userId} with ${partner.userId} in chat ${chatId}`);

      const newChat = await RandomChat.create(
        {
          id: chatId,
          user1: partner.userId,
          user2: userId,
          interest: interest || partner.interest,
          type: 'random',
          isAccepted: true,
        },
        { transaction },
      );

      await WaitingUser.destroy({
        where: { userId: partner.userId },
        transaction,
      });

      await transaction.commit();

      return res.status(200).json({
        matched: true,
        chatId: newChat.id,
        partnerId: partner.userId,
      });
    }

    // No match found — queue the user
    await WaitingUser.create(
      {
        userId,
        interest: interest || 'general',
      },
      { transaction },
    );

    await transaction.commit();

    console.log(`⏳ User ${userId} queued with interest: ${interest || 'general'}`);
    return res.status(200).json({
      matched: false,
      queued: true,
      message: 'Added to queue',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Matchmaking error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const endRandomChat = async (req: MyRequest, res: Response) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decodedToken.userId;

    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    console.log(`🔚 User ${userId} attempting to end chat ${chatId}`);

    // First check if chat exists and user is part of it
    const chat = await RandomChat.findOne({
      where: {
        id: chatId,
        [Op.or]: [{ user1: userId }, { user2: userId }],
      },
      transaction,
      lock: true,
    });

    if (!chat) {
      console.log(`⚠️ Chat ${chatId} not found or user ${userId} not part of it`);
      await transaction.commit();
      return res.status(404).json({
        message: 'Chat not found or user not part of it',
        ended: false,
      });
    }

    // Then check if chat is still active
    if (!chat.isAccepted) {
      console.log(`ℹ️ Chat ${chatId} was already ended`);
      await transaction.commit();
      return res.status(200).json({
        message: 'Chat was already ended',
        ended: true,
      });
    }

    // Update chat status
    await RandomChat.update(
      { isAccepted: false },
      {
        where: { id: chatId },
        transaction,
      },
    );

    console.log(`✅ Chat ${chatId} ended successfully`);
    await transaction.commit();

    return res.status(200).json({
      message: 'Chat ended successfully',
      ended: true,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ End chat error:', error);
    return res.status(500).json({
      message: 'Server error while ending chat',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const leaveRandomQueue = async (req: MyRequest, res: Response) => {
  let transaction: Transaction | undefined;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decodedToken.userId;

    console.log(`🚪 User ${userId} attempting to leave queue`);

    transaction = await withRetry(() =>
      sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      }),
    );

    // First cleanup any existing active chats
    const cleanedChats = await cleanupUserChats(userId, transaction);
    if (cleanedChats > 0) {
      console.log(`ℹ️ Cleaned up ${cleanedChats} active chats while leaving queue`);
    }

    // Check if user is actually in queue
    const queuedUser = await WaitingUser.findOne({
      where: { userId },
      transaction,
      lock: true,
    });

    if (queuedUser) {
      // Remove user from queue
      await WaitingUser.destroy({
        where: { userId },
        transaction,
      });
      console.log(`✅ User ${userId} successfully removed from queue`);
    } else {
      console.log(`ℹ️ User ${userId} not found in queue`);
    }

    await transaction.commit();

    return res.status(200).json({
      message: queuedUser ? 'Successfully left queue' : 'User not in queue',
      left: !!queuedUser,
      chatsEnded: cleanedChats,
      waitTime: queuedUser ? Math.floor((Date.now() - queuedUser.createdAt.getTime()) / 1000) : 0,
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError);
      }
    }
    console.error('❌ Leave queue error:', error);
    return res.status(500).json({
      message: 'Server error while leaving queue',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const sendRandomMessage = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const senderId = decodedToken.userId;

    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ message: 'chatId and text are required' });
    }

    const newMessage = await RandomMessage.create({
      chatId,
      senderId,
      text,
    });

    return res.status(200).json({
      message: 'Message sent',
      data: newMessage,
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const getRandomMessages = async (req: MyRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decodedToken.userId;

    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    const messages = await RandomMessage.findAll({
      where: { chatId },
      order: [['sentAt', 'ASC']],
    });

    return res.status(200).json({
      message: 'Messages fetched successfully',
      data: messages,
    });
  } catch (error) {
    console.error('❌ Fetch messages error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const newRandomChat = async (req: MyRequest, res: Response) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
    const userId = decodedToken.userId;
    const { interest } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    console.log(`🔍 User ${userId} requesting match with interest: ${interest || 'none'}`);

    // First check if user is already in an active chat
    const activeChat = await RandomChat.findOne({
      where: {
        [Op.or]: [{ user1: userId }, { user2: userId }],
        isAccepted: true,
      },
      transaction,
      lock: true,
    });

    if (activeChat) {
      console.log(`⚠️ User ${userId} is already in an active chat ${activeChat.id}`);
      await transaction.commit();
      return res.status(200).json({
        matched: true,
        chatId: activeChat.id,
        partnerId: activeChat.user1 === userId ? activeChat.user2 : activeChat.user1,
        message: 'Already in an active chat',
      });
    }

    // Then cleanup any existing active chats
    const cleanedChats = await cleanupUserChats(userId, transaction);
    if (cleanedChats > 0) {
      console.log(`ℹ️ Cleaned up ${cleanedChats} active chats before finding new match`);
    }

    // Check if user is already in queue
    const queuedUser = await WaitingUser.findOne({
      where: { userId },
      transaction,
      lock: true,
    });

    if (queuedUser) {
      console.log(`⚠️ User ${userId} is already in queue, checking for matches...`);

      // Update user's interest if provided
      if (interest) {
        await WaitingUser.update(
          { interest },
          {
            where: { userId },
            transaction,
          },
        );
        console.log(`📝 Updated user ${userId}'s interest to: ${interest}`);
      }

      // Log all users in queue for debugging
      const allQueuedUsers = await WaitingUser.findAll({
        where: { userId: { [Op.ne]: userId } },
        transaction,
      });
      console.log(`📊 Current queue status: ${allQueuedUsers.length} other users in queue`);
      allQueuedUsers.forEach(user => {
        console.log(`   - User ${user.userId} with interest: ${user.interest}`);
      });

      // Try to find a matching partner with flexible matching
      let partner = null;

      // First try to find any user who has been waiting longer than QUEUE_TIMEOUT_MS
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          createdAt: {
            [Op.lt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: true,
      });

      if (partner) {
        console.log(`⏰ Found user ${partner.userId} who has been waiting too long`);
      } else {
        // If no user waiting too long, try interest matching
        if (interest) {
          console.log(`🔎 Searching for users with interest: ${interest}`);

          // Try interest matching with flexible conditions
          partner = await WaitingUser.findOne({
            where: {
              userId: { [Op.ne]: userId },
              interest: {
                [Op.or]: [
                  interest, // Exact match
                  { [Op.like]: `%${interest}%` }, // Contains interest
                  { [Op.like]: `${interest}%` }, // Starts with interest
                  { [Op.like]: `%${interest}` }, // Ends with interest
                ],
              },
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: true,
          });

          if (partner) {
            console.log(`🎯 Found interest match with user ${partner.userId} (${partner.interest})`);
          } else {
            console.log(`❌ No interest match found for interest: ${interest}`);
          }
        } else {
          // If no interest specified, try to match with any user who has been waiting
          partner = await WaitingUser.findOne({
            where: {
              userId: { [Op.ne]: userId },
            },
            order: [['createdAt', 'ASC']],
            transaction,
            lock: true,
          });

          if (partner) {
            console.log(`🎯 Found general match with user ${partner.userId}`);
          } else {
            console.log(`❌ No general match found`);
          }
        }
      }

      if (partner) {
        const chatId = uuidv4();
        console.log(`✨ Creating chat ${chatId} between users ${userId} and ${partner.userId}`);

        const newChat = await RandomChat.create(
          {
            id: chatId,
            user1: partner.userId,
            user2: userId,
            interest: interest || partner.interest,
            type: 'random',
            isAccepted: true,
          },
          { transaction },
        );

        // Remove both users from queue
        await WaitingUser.destroy({
          where: { userId: partner.userId },
          transaction,
        });
        console.log(`✅ Removed user ${partner.userId} from queue`);

        await WaitingUser.destroy({
          where: { userId },
          transaction,
        });
        console.log(`✅ Removed user ${userId} from queue`);

        await transaction.commit();

        return res.status(200).json({
          matched: true,
          chatId: newChat.id,
          partnerId: partner.userId,
          message: 'Match found',
        });
      }

      // No match found, return queue status
      console.log(`⏳ No match found for user ${userId}, staying in queue`);
      await transaction.commit();
      return res.status(200).json({
        message: 'Already in queue, waiting for match',
        queued: true,
        waitTime: Math.floor((Date.now() - queuedUser.createdAt.getTime()) / 1000),
      });
    }

    // Try to find a matching partner with flexible matching
    let partner = null;

    // 1. Try exact interest match if interest provided
    if (interest) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          interest,
          createdAt: {
            [Op.gt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: true,
      });
    }

    // 2. Try partial interest match if no exact match
    if (!partner && interest) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          interest: {
            [Op.like]: `%${interest}%`,
          },
          createdAt: {
            [Op.gt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: true,
      });
    }

    // 3. Fallback to any user waiting too long
    if (!partner) {
      partner = await WaitingUser.findOne({
        where: {
          userId: { [Op.ne]: userId },
          createdAt: {
            [Op.lt]: new Date(Date.now() - QUEUE_TIMEOUT_MS),
          },
        },
        order: [['createdAt', 'ASC']],
        transaction,
        lock: true,
      });
    }

    if (partner) {
      const chatId = uuidv4();
      console.log(`🎯 Match found: User ${userId} with ${partner.userId} in chat ${chatId}`);

      const newChat = await RandomChat.create(
        {
          id: chatId,
          user1: partner.userId,
          user2: userId,
          interest: interest || partner.interest,
          type: 'random',
          isAccepted: true,
        },
        { transaction },
      );

      await WaitingUser.destroy({
        where: { userId: partner.userId },
        transaction,
      });

      await transaction.commit();

      return res.status(200).json({
        matched: true,
        chatId: newChat.id,
        partnerId: partner.userId,
        message: 'Match found',
      });
    }

    // No match found — queue the user
    await WaitingUser.create(
      {
        userId,
        interest: interest || 'general',
      },
      { transaction },
    );

    await transaction.commit();

    console.log(`⏳ User ${userId} queued with interest: ${interest || 'general'}`);
    return res.status(200).json({
      matched: false,
      queued: true,
      message: 'Added to queue',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ New random chat error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
