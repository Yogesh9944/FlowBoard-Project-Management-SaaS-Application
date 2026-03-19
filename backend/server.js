const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Trust proxy (required for Render)
app.set('trust proxy', 1);

// ✅ Allowed origin (dev + production)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ======================
// ✅ Socket.IO Setup
// ======================
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes/controllers
app.set('io', io);

// ======================
// ✅ Middleware
// ======================
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static folder
app.use('/uploads', express.static('uploads'));

// ======================
// ✅ Root Route (Fix for "Cannot GET /")
// ======================
app.get('/', (req, res) => {
  res.send('🚀 FlowBoard Backend API is running successfully');
});

// ======================
// ✅ Health Check Route
// ======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
  });
});

// ======================
// ✅ API Routes
// ======================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspace'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/boards', require('./routes/board'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/comments', require('./routes/comment'));

// ======================
// ❌ 404 Handler (Optional but clean)
// ======================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// ======================
// ✅ Global Error Handler
// ======================
app.use(errorHandler);

// ======================
// ✅ Socket.IO Events
// ======================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ======================
// ✅ Start Server
// ======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export (optional)
module.exports = { app, io };
