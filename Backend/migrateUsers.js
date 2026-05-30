import mongoose from 'mongoose';
import dotenv from 'dotenv';
import admin from './config/firebase.js';
import User from './models/User.js';
dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Get all employees without firebaseUid
    const employees = await User.find({ role: 'employee' });
    console.log(`Found ${employees.length} employees`);

    for (const employee of employees) {
      try {
        // Check if already exists in Firebase
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().getUserByEmail(employee.email);
          console.log(`Already exists: ${employee.email}`);
        } catch (err) {
          if (err.code === 'auth/user-not-found') {
            // Create in Firebase with default password
            firebaseUser = await admin.auth().createUser({
              email: employee.email,
              password: 'Password@123',
              displayName: employee.name || 'Employee',
            });
            console.log(`Created: ${employee.email}`);
          }
        }

        // Update MongoDB with firebaseUid
        employee.firebaseUid = firebaseUser.uid;
        await employee.save();

      } catch (err) {
        console.log(`Failed for ${employee.email}:`, err.message);
      }
    }

    console.log('-----------------------------------');
    console.log('Migration Complete!');
    console.log('All employees can now login with:');
    console.log('Password: Password@123');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Migration Error:', err);
    process.exit(1);
  }
};

migrateUsers();