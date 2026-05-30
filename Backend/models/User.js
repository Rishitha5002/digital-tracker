import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true }, // The seed script now populates this
  role: { 
    type: String, 
    enum: ['employee', 'admin'], 
    default: 'employee' 
  },
  designation: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  phone: { type: String, default: '' },
  notificationSettings: {
    tripAlerts: { type: Boolean, default: true },
    employeeUpdates: { type: Boolean, default: true },
    systemMessages: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);