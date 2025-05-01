import { Response } from 'express';
import { MyRequest } from '../Interfaces/Request.interface';
import VibeCard from '../Models/VibeCard.model';
import jwt from 'jsonwebtoken';
import User from '../Models/User.model';

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

export const createVibeCard = async (request: MyRequest, response: Response) => {
  try {
    const { title, imageUrl } = request.body;

    if (!title || !imageUrl) {
      return response.status(400).json({ message: 'Title and imageUrl are required' });
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const cardCount = await VibeCard.count({ where: { userId } });
    if (cardCount >= 3) {
      return response.status(400).json({
        message: 'You have reached the maximum limit of 3 vibe cards',
      });
    }

    const vibeCard = await VibeCard.create({
      title,
      imageUrl,
      userId,
    });

    return response.status(201).json({
      message: 'Vibe card created successfully',
      vibeCard,
    });
  } catch (error) {
    return response.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
};

export const getVibeCards = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const vibeCards = await VibeCard.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (!vibeCards || vibeCards.length === 0) {
      return response.status(404).json({ message: 'No vibe cards found' });
    }

    return response.status(200).json(vibeCards);
  } catch (error) {
    return response.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
};

export const getVibeCardsByUserId = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const currentUserId = decodedToken.userId;
    if (!currentUserId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const user = await User.findOne({ where: { userId: currentUserId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const { userId: targetUserId } = request.params;

    if (!targetUserId) {
      return response.status(400).json({ message: 'User ID is required' });
    }

    const vibeCards = await VibeCard.findAll({
      where: { userId: targetUserId },
      order: [['createdAt', 'DESC']],
    });

    if (!vibeCards || vibeCards.length === 0) {
      return response.status(200).json({ message: 'No vibe cards found' });
    }

    return response.status(200).json(vibeCards);
  } catch (error) {
    return response.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
};

export const updateVibeCard = async (request: MyRequest, response: Response) => {
  try {
    const { id } = request.params;
    const { title, imageUrl } = request.body;

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const vibeCard = await VibeCard.findOne({
      where: { id, userId },
    });

    if (!vibeCard) {
      return response.status(404).json({ message: 'Vibe card not found' });
    }

    const updateData: { title?: string; imageUrl?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await vibeCard.update(updateData);

    const updatedCard = await vibeCard.reload();

    return response.status(200).json({
      message: 'Vibe card updated successfully',
      vibeCard: updatedCard,
    });
  } catch (error) {
    return response.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
};

export const deleteVibeCard = async (request: MyRequest, response: Response) => {
  try {
    const { id } = request.params;

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return response.status(401).json({ message: 'Unauthorized: No userId found in JWT' });
    }

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const vibeCard = await VibeCard.findOne({
      where: { id, userId },
    });

    if (!vibeCard) {
      return response.status(404).json({ message: 'Vibe card not found' });
    }

    await vibeCard.destroy();

    return response.status(200).json({ message: 'Vibe card deleted successfully' });
  } catch (error) {
    return response.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
};
