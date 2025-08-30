import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'blogapp';

  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected');
  } catch (err: any) {
    console.error('MongoDB connection error:', err?.message || err);
    process.exit(1);
  }
};
