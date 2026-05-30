import express from 'express';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Employee analytics
router.get('/my', verifyToken, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id });
    const expenses = await Expense.find({ employee: req.user.id });

    // Weekly trips (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyTrips = trips.filter(t =>
      new Date(t.startTime) >= weekAgo
    );

    // Monthly trips (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlyTrips = trips.filter(t =>
      new Date(t.startTime) >= monthAgo
    );

    // Total distance
    const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const weeklyDistance = weeklyTrips.reduce((sum, t) => sum + (t.distance || 0), 0);

    // Total stops
    const totalStops = trips.reduce((sum, t) => sum + (t.stops?.length || 0), 0);

    // Total stop time (minutes)
    const totalStopTime = trips.reduce((sum, t) => {
      const stopTime = t.stops?.reduce((s, stop) => s + (stop.duration || 0), 0) || 0;
      return sum + stopTime;
    }, 0);

    // Average trip duration
    const completedTrips = trips.filter(t => t.endTime);
    const avgDuration = completedTrips.length > 0
      ? completedTrips.reduce((sum, t) => {
          return sum + (new Date(t.endTime) - new Date(t.startTime));
        }, 0) / completedTrips.length / 1000 / 60
      : 0;

    // Daily trips for last 7 days chart
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTrips = trips.filter(t => {
        const tripDate = new Date(t.startTime);
        return tripDate.toDateString() === date.toDateString();
      });
      dailyData.push({
        date: date.toLocaleDateString('en', { weekday: 'short' }),
        trips: dayTrips.length,
        distance: dayTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000
      });
    }

    res.json({
      totalTrips: trips.length,
      weeklyTrips: weeklyTrips.length,
      monthlyTrips: monthlyTrips.length,
      totalDistance: totalDistance / 1000,
      weeklyDistance: weeklyDistance / 1000,
      totalStops,
      totalStopTime,
      avgDuration: Math.round(avgDuration),
      totalExpenses: expenses.length,
      approvedExpenses: expenses.filter(e => e.status === 'approved').length,
      totalExpenseAmount: expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0),
      dailyData
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Admin analytics
router.get('/admin', verifyToken, isAdmin, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    const trips = await Trip.find().populate('user', 'name email');
    const expenses = await Expense.find();

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTrips = trips.filter(t => new Date(t.startTime) >= today);
    const activeTrips = trips.filter(t => t.status === 'active');

    // Top employees by distance
    const employeeStats = employees.map(emp => {
      const empTrips = trips.filter(t => t.user?._id?.toString() === emp._id.toString());
      const empExpenses = expenses.filter(e => e.employee?.toString() === emp._id.toString());
      const completedTrips = empTrips.filter(t => t.endTime);
      const avgDuration = completedTrips.length > 0
        ? completedTrips.reduce((sum, t) => {
            return sum + (new Date(t.endTime) - new Date(t.startTime));
          }, 0) / completedTrips.length / 1000 / 60
        : 0;

      return {
        name: emp.name,
        email: emp.email,
        totalTrips: empTrips.length,
        totalDistance: empTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000,
        avgDuration: Math.round(avgDuration),
        totalExpenses: empExpenses.length,
        approvedExpenses: empExpenses.filter(e => e.status === 'approved').length,
        activeTrip: empTrips.some(t => t.status === 'active')
      };
    }).sort((a, b) => b.totalDistance - a.totalDistance);

    // Daily data for last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTrips = trips.filter(t => {
        const tripDate = new Date(t.startTime);
        return tripDate.toDateString() === date.toDateString();
      });
      dailyData.push({
        date: date.toLocaleDateString('en', { weekday: 'short' }),
        trips: dayTrips.length,
        distance: dayTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000
      });
    }

    res.json({
      totalEmployees: employees.length,
      activeTrips: activeTrips.length,
      todayTrips: todayTrips.length,
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000,
      pendingExpenses: expenses.filter(e => e.status === 'pending').length,
      totalExpenseAmount: expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + e.amount, 0),
      employeeStats,
      dailyData
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

export default router;