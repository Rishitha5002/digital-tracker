import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const getMongoUri = () => {
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
  return uri.replace(/^["']|["']$/g, '');
};

const connectDB = async () => {
  const uri = getMongoUri();

  if (!uri) {
    console.error('MongoDB URI missing. Set MONGO_URI or MONGODB_URI in Backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error(
        'Tip: Check internet, VPN/firewall, and MongoDB Atlas Network Access (allow 0.0.0.0/0 for testing).'
      );
    }
    process.exit(1);
  }
};

export default connectDB;
