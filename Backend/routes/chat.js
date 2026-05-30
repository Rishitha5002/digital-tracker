import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/my', verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load messages' });
  }
});

router.get('/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.params.userId })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load messages' });
  }
});

export default router;
