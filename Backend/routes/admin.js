import express from 'express';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth & admin check to all routes here
router.use(verifyToken, isAdmin);

// Get all employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    res.json(employees);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const trips = await Trip.find();
    const activeTrips = trips.filter(t => t.status === 'active');
    const activeEmployeeIds = new Set(
      activeTrips.map(t => t.user?.toString()).filter(Boolean)
    );

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyTrips = trips.filter(t => new Date(t.startTime) >= weekAgo);

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTrips = trips.filter(t => {
        const tripDate = new Date(t.startTime);
        return tripDate.toDateString() === date.toDateString();
      });
      dailyData.push({
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        trips: dayTrips.length
      });
    }

    res.json({
      totalEmployees: employees.length,
      activeEmployees: activeEmployeeIds.size,
      totalTrips: trips.length,
      activeTrips: activeTrips.length,
      dailyData
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Get trip history for an employee
router.get('/trips/:employeeId', async (req, res) => {
  try {
    // We assume employeeId passed is the Mongo _id
    const trips = await Trip.find({ user: req.params.employeeId }).sort({ startTime: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;