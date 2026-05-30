import express from 'express';
import SupportRequest from '../models/SupportRequest.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const request = await SupportRequest.create({
      name,
      email: email.toLowerCase().trim(),
      subject,
      message,
      userId: req.user._id
    });

    res.status(201).json({
      msg: 'Support request submitted successfully',
      id: request._id
    });
  } catch (err) {
    console.error('Support request error:', err);
    res.status(500).json({ msg: 'Failed to submit support request' });
  }
});

export default router;
