require('dotenv').config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
    });
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;