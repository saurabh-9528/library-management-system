const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const connURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_system';
    console.log(`Connecting to MongoDB...`);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
