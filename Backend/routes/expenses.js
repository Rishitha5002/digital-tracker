import express from 'express';
import Expense from '../models/Expense.js';
import Trip from '../models/Trip.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Add expense (employee)
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { tripId, amount, category, description, receiptNote } = req.body;

    // Get active trip if no tripId provided
    let trip = null;
    if (tripId) {
      trip = tripId;
    } else {
      const activeTrip = await Trip.findOne({
        user: req.user.id,
        status: 'active'
      });
      if (activeTrip) trip = activeTrip._id;
    }

    const expense = new Expense({
      employee: req.user.id,
      trip,
      amount,
      category,
      description,
      receiptNote: receiptNote || ''
    });

    await expense.save();
    res.json({ msg: 'Expense added successfully', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get my expenses (employee)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user.id })
      .populate('trip', 'startTime endTime')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get my expense stats (employee)
router.get('/my/stats', verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user.id });
    const stats = {
      total: expenses.length,
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      rejected: expenses.filter(e => e.status === 'rejected').length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      approvedAmount: expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get all expenses (admin)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const expenses = await Expense.find(filter)
      .populate('employee', 'name email')
      .populate('trip', 'startTime endTime')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get expense stats for admin
router.get('/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const expenses = await Expense.find();
    const stats = {
      total: expenses.length,
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      rejected: expenses.filter(e => e.status === 'rejected').length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      pendingAmount: expenses
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Approve expense (admin)
router.put('/:id/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('employee', 'name email');
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });
    res.json({ msg: 'Expense approved', expense });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Reject expense (admin)
router.put('/:id/reject', verifyToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason || 'No reason provided',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('employee', 'name email');
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });
    res.json({ msg: 'Expense rejected', expense });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

export default router;