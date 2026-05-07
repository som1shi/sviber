const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set — skipping DB connection.');
    return;
  }
  const hostMatch = String(uri).match(/@([^/?]+)/);
  const mongoHost = hostMatch?.[1] || '(unparsed-host)';
  console.log(`MongoDB target host: ${mongoHost}`);
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
