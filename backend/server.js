require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');
const bugRoutes = require('./routes/bugRoutes');
const promptRoutes = require('./routes/promptRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningInsightsRoutes = require('./routes/learningInsightsRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Production and development CORS configurations
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    const allowed = !origin || 
                    origin.includes('localhost') || 
                    origin.includes('127.0.0.1') ||
                    allowedOrigins.includes(origin) ||
                    origin.includes('vercel.app');
                    
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BugLog API is running',
    docs: '/api/docs',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/bugs', protect, bugRoutes);
app.use('/api/prompts', protect, promptRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/learning-insights', protect, learningInsightsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`BugLog server running on port ${PORT}`);
});
