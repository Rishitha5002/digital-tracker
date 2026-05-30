import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import admin from '../config/firebase.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Firebase API Key from environment
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// @route   POST api/auth/register
// @desc    Create User in Firebase & MongoDB (Server-Side)
router.post('/register', async (req, res) => {
  const { name, email, password, role, designation } = req.body;

  try {
    // 1. Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    // 2. Create User in Firebase
    const firebaseUser = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: name,
    });

    // 3. Create User in MongoDB
    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      firebaseUid: firebaseUser.uid,
      role: role || 'employee',
      designation: designation || ''
    });

    await user.save();

    res.status(201).json({ msg: 'User registered successfully. Please login.' });
  } catch (err) {
    console.error("Register Error:", err);
    if(err.code === 'auth/email-already-exists') {
        return res.status(400).json({ msg: 'Email already exists in Firebase' });
    }
    if(err.code === 'auth/invalid-email') {
        return res.status(400).json({ msg: 'Invalid email format' });
    }
    if(err.code === 'auth/weak-password') {
        return res.status(400).json({ msg: 'Password is too weak (minimum 6 characters)' });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Login via Firebase REST API (No Client SDK needed)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if mongo user exists first
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    // 2. Exchange Email/Password for ID Token via Firebase REST API
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    const response = await axios.post(url, {
      email,
      password,
      returnSecureToken: true
    });

    const { idToken, refreshToken, localId } = response.data;

    // 3. Return Token & User Info
    res.json({
      token: idToken,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        phone: user.phone,
        profilePicture: user.profilePicture,
        firebaseUid: localId,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error("Login Error:", err.response ? err.response.data : err.message);
    res.status(400).json({ msg: 'Invalid Credentials' });
  }
});

// @route   POST api/auth/send-reset-email
// @desc    Send Firebase Password Reset Email (Uses Firebase's Built-in Email with OTP Code)
router.post('/send-reset-email', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Validate input
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // 2. Check if user exists in MongoDB
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // For security, don't reveal if email exists or not
    if (!user) {
      return res.json({ 
        msg: 'If this email is registered, a password reset link has been sent.',
        success: true 
      });
    }

    // 3. Generate OTP and save to database
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // 4. Log OTP for development (in production, send via email service)
    console.log(`Password Reset OTP for ${email}: ${otp}`);
    console.log(`OTP expires at: ${expiresAt}`);

    res.json({ 
      msg: `Password reset OTP sent. Development mode - OTP: ${otp}`,
      success: true,
      otp: otp // Only for development - remove in production
    });

  } catch (err) {
    console.error('Send Reset Email Error:', err.message);
    res.status(500).json({ msg: 'Failed to send reset email. Please try again.' });
  }
});

// @route   POST api/auth/verify-reset-code
// @desc    Verify the password reset code from Firebase email
router.post('/verify-reset-code', async (req, res) => {
  const { oobCode } = req.body;

  try {
    if (!oobCode) {
      return res.status(400).json({ msg: 'Reset code is required' });
    }

    // Verify the reset code with Firebase
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`;
    
    const response = await axios.post(verifyUrl, {
      oobCode: oobCode
    });

    res.json({ 
      msg: 'Reset code verified successfully',
      email: response.data.email,
      success: true 
    });

  } catch (err) {
    console.error('Verify Reset Code Error:', err.response ? err.response.data : err.message);
    
    if (err.response?.data?.error?.message === 'INVALID_OOB_CODE') {
      return res.status(400).json({ msg: 'Invalid or expired reset code' });
    }
    
    res.status(400).json({ msg: 'Failed to verify reset code' });
  }
});

// @route   POST api/auth/confirm-password-reset
// @desc    Reset password using the code from email
router.post('/confirm-password-reset', async (req, res) => {
  const { oobCode, newPassword } = req.body;

  try {
    // 1. Validate input
    if (!oobCode || !newPassword) {
      return res.status(400).json({ msg: 'Reset code and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // 2. Reset password using Firebase REST API
    const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`;
    
    const response = await axios.post(resetUrl, {
      oobCode: oobCode,
      newPassword: newPassword
    });

    res.json({ 
      msg: 'Password reset successfully. You can now login with your new password.',
      success: true 
    });

  } catch (err) {
    console.error('Confirm Password Reset Error:', err.response ? err.response.data : err.message);
    
    const errorMessage = err.response?.data?.error?.message;
    
    if (errorMessage === 'INVALID_OOB_CODE') {
      return res.status(400).json({ msg: 'Invalid or expired reset code' });
    } else if (errorMessage === 'WEAK_PASSWORD') {
      return res.status(400).json({ msg: 'Password is too weak. Use at least 6 characters.' });
    }
    
    res.status(500).json({ msg: 'Failed to reset password. Please try again.' });
  }
});

// ============================================================================
// ALTERNATIVE: Custom OTP System (If you want to keep using your Otp model)
// ============================================================================

// @route   POST api/auth/forgot-password
// @desc    Send Firebase Password Reset Email (uses Firebase's built-in email system)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security, don't reveal if email exists
    if (!user) {
      return res.json({
        msg: 'If this email is registered, a password reset link has been sent.',
        success: true
      });
    }

    // Send password reset email using Firebase REST API
    const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;

    await axios.post(resetUrl, {
      requestType: 'PASSWORD_RESET',
      email: email
    });

    res.json({
      msg: 'Password reset email sent successfully. Check your inbox.',
      success: true
    });

  } catch (err) {
    console.error('Forgot Password Error:', err.response ? err.response.data : err.message);

    // Don't expose internal errors to user
    if (err.response?.data?.error?.message === 'EMAIL_NOT_FOUND') {
      return res.json({
        msg: 'If this email is registered, a password reset link has been sent.',
        success: true
      });
    }

    res.status(500).json({ msg: 'Failed to send reset email. Please try again.' });
  }
});

// @route   GET api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    designation: req.user.designation,
    phone: req.user.phone,
    profilePicture: req.user.profilePicture,
    createdAt: req.user.createdAt,
    notificationSettings: req.user.notificationSettings
  });
});

// @route   POST api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    await axios.post(url, {
      email: req.user.email,
      password: currentPassword,
      returnSecureToken: true
    });

    await admin.auth().updateUser(req.user.firebaseUid, { password: newPassword });

    res.json({ msg: 'Password updated successfully', success: true });
  } catch (err) {
    console.error('Change Password Error:', err.response?.data || err.message);
    if (err.response?.data?.error?.message === 'INVALID_PASSWORD' ||
        err.response?.data?.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    res.status(500).json({ msg: 'Failed to update password' });
  }
});

// @route   GET/PUT api/auth/notification-settings
router.get('/notification-settings', verifyToken, async (req, res) => {
  res.json(req.user.notificationSettings || {});
});

router.put('/notification-settings', verifyToken, async (req, res) => {
  try {
    const settings = req.body;
    req.user.notificationSettings = {
      ...req.user.notificationSettings?.toObject?.() || req.user.notificationSettings || {},
      ...settings
    };
    await req.user.save();
    res.json({ msg: 'Settings saved', notificationSettings: req.user.notificationSettings });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to save settings' });
  }
});

// @route   PUT api/auth/update-email
router.put('/update-email', verifyToken, async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    await admin.auth().updateUser(req.user.firebaseUid, { email: email.toLowerCase().trim() });
    req.user.email = email.toLowerCase().trim();
    await req.user.save();

    res.json({ msg: 'Email updated successfully', email: req.user.email });
  } catch (err) {
    console.error('Update Email Error:', err.message);
    res.status(500).json({ msg: 'Failed to update email' });
  }
});

// @route   PUT api/auth/update-role
router.put('/update-role', verifyToken, async (req, res) => {
  const { role } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ msg: 'Role is required' });
    }

    if (!['employee', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    req.user.role = role;
    await req.user.save();

    res.json({ msg: 'Role updated successfully', role: req.user.role });
  } catch (err) {
    console.error('Update Role Error:', err.message);
    res.status(500).json({ msg: 'Failed to update role' });
  }
});

// @route   PUT api/auth/update-profile
router.put('/update-profile', verifyToken, async (req, res) => {
  const { name, designation, phone, profilePicture } = req.body;

  try {
    if (name) req.user.name = name;
    if (designation !== undefined) req.user.designation = designation;
    if (phone !== undefined) req.user.phone = phone;
    if (profilePicture !== undefined) req.user.profilePicture = profilePicture;

    await req.user.save();

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        designation: req.user.designation,
        profilePicture: req.user.profilePicture,
        phone: req.user.phone,
        createdAt: req.user.createdAt
      }
    });
  } catch (err) {
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ msg: 'Failed to update profile' });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP without resetting password
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    // Find and verify OTP
    const validOtp = await Otp.findOne({ 
      email: email.toLowerCase().trim(), 
      otp: otp.trim() 
    });

    if (!validOtp) {
      return res.status(400).json({ 
        msg: 'Invalid or expired OTP',
        success: false 
      });
    }

    res.json({ 
      msg: 'OTP verified successfully',
      success: true 
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset Password using Custom OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 1. Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // 2. Verify OTP
    const validOtp = await Otp.findOne({ 
      email: email.toLowerCase().trim(), 
      otp: otp.trim() 
    });
    
    if (!validOtp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // 3. Find User in MongoDB
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // 4. Update Password in Firebase using Admin SDK
    await admin.auth().updateUser(user.firebaseUid, {
      password: newPassword
    });

    // 5. Delete the used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    res.json({ 
      msg: 'Password reset successfully. You can now login with your new password.',
      success: true 
    });

  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route   POST api/auth/resend-otp
// @desc    Resend OTP to user's email
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.json({ 
        msg: 'If this email is registered, an OTP has been sent.',
        success: true 
      });
    }

    // Delete old OTPs
    await Otp.deleteMany({ email: email.toLowerCase().trim() });

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to database
    await Otp.create({ 
      email: email.toLowerCase().trim(), 
      otp: otpCode 
    });

    // Send email
    console.log(`[RESEND OTP] for ${email}: ${otpCode}`);
    
    // TODO: Implement email sending here

    res.json({ 
      msg: 'OTP resent successfully',
      success: true,
      dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });

  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;