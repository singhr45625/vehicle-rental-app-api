const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for mobile app
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// DEBUG LOGGER
app.use((req, res, next) => {
  console.log(`[SERVER] Received Request: ${req.method} ${req.url}`);
  next();
});

// Share io instance with controllers
app.set('io', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a specific chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
connectDB()
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get("/", (req, res) => res.status(200).json({ status: "OK" }));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;
// Change from app.listen to server.listen
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));