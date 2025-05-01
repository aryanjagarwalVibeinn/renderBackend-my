import express from 'express';
import Call from '../Models/Call.model';

const router = express.Router();

// 🧪 Get Call History for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ calls });
  } catch (error) {
    console.error('❌ Error fetching call history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
