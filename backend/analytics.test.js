const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningInsightsRoutes = require('./routes/learningInsightsRoutes');
const User = require('./models/User');
const BugEntry = require('./models/BugEntry');
const jwt = require('jsonwebtoken');

// Mock middleware
jest.mock('./middleware/asyncHandler', () => fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

const app = express();
app.use(express.json());

// Inject user logic for testing
const userInjector = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignored for testing
    }
  }
  next();
};

app.use(userInjector);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning-insights', learningInsightsRoutes);

let mongoServer;
let testUser;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await BugEntry.deleteMany({});

  testUser = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
  token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('Analytics & Insights API', () => {
  describe('GET /api/analytics', () => {
    it('should retrieve aggregated statistics', async () => {
      // Create seed bugs
      await BugEntry.create({
        userId: testUser._id,
        title: 'CORS Bug',
        technology: 'Node.js',
        status: 'open',
        isFavorited: true
      });
      await BugEntry.create({
        userId: testUser._id,
        title: 'React Loop',
        technology: 'React',
        status: 'resolved'
      });

      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.total).toBe(2);
      expect(res.body.data.stats.open).toBe(1);
      expect(res.body.data.stats.resolved).toBe(1);
      expect(res.body.data.stats.favorites).toBe(1);
      expect(res.body.data.technologyDistribution.length).toBe(2);
    });
  });

  describe('GET /api/learning-insights', () => {
    it('should retrieve heuristic AI learning insights', async () => {
      // Create seed bugs for learning heuristics
      await BugEntry.create({
        userId: testUser._id,
        title: 'CORS issue in express',
        errorMessage: 'Access-Control-Allow-Origin header missing',
        technology: 'Node.js',
        cause: 'Missing cors middleware configuration',
        solution: 'app.use(cors())',
        status: 'resolved'
      });

      const res = await request(app)
        .get('/api/learning-insights')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('bugsSolvedThisWeek');
      expect(res.body.data.suggestedLearningTopics.length).toBeGreaterThan(0);
    });
  });
});
