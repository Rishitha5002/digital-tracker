import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  address: { type: String, default: '' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in minutes
  reason: { type: String, default: '' }
}, { _id: true });

const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  startLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' }
  },
  endLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  path: { type: Array, default: [] },
  distance: { type: Number, default: 0 },
  stoppedTime: { type: Number, default: 0 },
  stops: [stopSchema]
}, { timestamps: true });

export default mongoose.model('Trip', TripSchema);