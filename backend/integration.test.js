const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const bugRoutes = require('./routes/bugRoutes');
const promptRoutes = require('./routes/promptRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const learningInsightsRoutes = require('./routes/learningInsightsRoutes');

const User = require('./models/User');
const BugEntry = require('./models/BugEntry');
const Prompt = require('./models/Prompt');

// Mock asyncHandler
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
app.use('/api/auth', authRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning-insights', learningInsightsRoutes);

let mongoServer;

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
  await Prompt.deleteMany({});
});

describe('System Integration Flows', () => {
  
  describe('Flow 1: Register → Login → Fetch Dashboard Bugs', () => {
    it('should complete registration, login, and fetch user dashboard successfully', async () => {
      // 1. Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.user.email).toBe('jane@example.com');
      
      // 2. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'password123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      const userToken = loginRes.body.data.token;
      expect(userToken).toBeDefined();

      // 3. Fetch Dashboard Bugs (Protected)
      const dashboardRes = await request(app)
        .get('/api/bugs')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.body.success).toBe(true);
      expect(Array.isArray(dashboardRes.body.data)).toBe(true);
    });
  });

  describe('Flow 2: Login → Create Bug → View Bug → Edit Bug → Delete Bug', () => {
    it('should successfully complete the CRUD lifecycle of a bug entry', async () => {
      // Create user & log in
      const user = await User.create({ name: 'Bob Smith', email: 'bob@example.com', password: 'password123' });
      const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // 1. Create Bug
      const createRes = await request(app)
        .post('/api/bugs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Database connection leak',
          errorMessage: 'Too many connections open',
          technology: 'Node.js',
          rootCause: 'Connection not closed in pool helper',
          verifiedFinalFix: 'Added client.release() in finally block',
          priority: 'high'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const bugId = createRes.body.data._id;
      expect(bugId).toBeDefined();

      // 2. View Bug
      const viewRes = await request(app)
        .get(`/api/bugs/${bugId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(viewRes.status).toBe(200);
      expect(viewRes.body.success).toBe(true);
      expect(viewRes.body.data.title).toBe('Database connection leak');

      // 3. Edit Bug
      const editRes = await request(app)
        .put(`/api/bugs/${bugId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Database connection leak title',
          status: 'resolved'
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.success).toBe(true);
      expect(editRes.body.data.title).toBe('Updated Database connection leak title');
      expect(editRes.body.data.status).toBe('resolved');

      // 4. Delete Bug
      const deleteRes = await request(app)
        .delete(`/api/bugs/${bugId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify not found
      const finalViewRes = await request(app)
        .get(`/api/bugs/${bugId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(finalViewRes.status).toBe(404);
    });
  });

  describe('Flow 3: Prompt Vault Flow', () => {
    it('should create a prompt, fetch prompts list, toggle favorite status, and delete a prompt', async () => {
      // Create user & log in
      const user = await User.create({ name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' });
      const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // 1. Create Prompt
      const createRes = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          prompt: 'Optimize MongoDB indexing for compound queries',
          aiTool: 'Gemini',
          category: 'MongoDB',
          effectivenessRating: 5
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const promptId = createRes.body.data._id;

      // 2. Fetch Prompts list
      const listRes = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.count).toBe(1);

      // 3. Toggle Favorite Status
      const favRes = await request(app)
        .patch(`/api/prompts/${promptId}/favorite`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(favRes.status).toBe(200);
      expect(favRes.body.success).toBe(true);
      expect(favRes.body.data.isFavorited).toBe(true);

      // 4. Delete Prompt
      const deleteRes = await request(app)
        .delete(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });

  describe('Flow 4: Analytics Loading', () => {
    it('should successfully load summary stats and heuristic insights', async () => {
      // Create user & log in
      const user = await User.create({ name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123' });
      const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Seed a bug to make analytics meaningful
      await BugEntry.create({
        userId: user._id,
        title: 'Crash on null pointer',
        errorMessage: 'Null reference exception',
        technology: 'Node.js',
        status: 'open',
        priority: 'high'
      });

      // 1. Fetch Analytics
      const analyticsRes = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.success).toBe(true);
      expect(analyticsRes.body.data.stats.total).toBe(1);

      // 2. Fetch Learning Insights
      const insightsRes = await request(app)
        .get('/api/learning-insights')
        .set('Authorization', `Bearer ${userToken}`);

      expect(insightsRes.status).toBe(200);
      expect(insightsRes.body.success).toBe(true);
      expect(insightsRes.body.data.bugsSolvedThisWeek).toBe(0);
      expect(Array.isArray(insightsRes.body.data.sentences)).toBe(true);
    });
  });

});
