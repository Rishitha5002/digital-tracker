import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['fuel', 'food', 'toll', 'parking', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  receiptNote: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);