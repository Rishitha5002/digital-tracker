import admin from 'firebase-admin';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);

// Load service account directly from JSON file
const serviceAccount = require('../digital-tracker-4edc9-firebase-adminsdk.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin Error:', error);
  }
}

export default admin;