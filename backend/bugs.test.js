const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bugRoutes = require('./routes/bugRoutes');
const { protect } = require('./middleware/auth');
const User = require('./models/User');
const BugEntry = require('./models/BugEntry');
const jwt = require('jsonwebtoken');

// Mock middleware
jest.mock('./middleware/asyncHandler', () => fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

const app = express();
app.use(express.json());

// We need a way to inject the user from the token into the request
const userInjector = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Invalid token, but we don't block the request for testing purposes
      // The route's logic will handle unauthorized access
    }
  }
  next();
};

app.use(userInjector);
app.use('/api/bugs', bugRoutes);

let mongoServer;
let testUser;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  process.env.JWT_SECRET = 'testsecret'; // Use a fixed secret for testing
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

describe('Bug API', () => {
  describe('POST /api/bugs', () => {
    it('should create a bug entry', async () => {
      const res = await request(app)
        .post('/api/bugs')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Bug', status: 'open' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Bug');
      expect(res.body.data.userId.toString()).toBe(testUser._id.toString());
    });

    it('should return 400 if title is missing', async () => {
        const res = await request(app)
          .post('/api/bugs')
          .set('Authorization', `Bearer ${token}`)
          .send({ status: 'open' });
  
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Title is required');
      });
  });

  describe('GET /api/bugs', () => {
    it('should get all bugs for the logged-in user', async () => {
      await BugEntry.create({ userId: testUser._id, title: 'Bug 1', status: 'open' });
      await BugEntry.create({ userId: testUser._id, title: 'Bug 2', status: 'resolved' });

      const res = await request(app)
        .get('/api/bugs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
    it('should return 401 for unauthorized access', async () => {
      const res = await request(app)
        .get('/api/bugs')
        .set('Authorization', `Bearer invalidtoken`);

      // The middleware should catch this and the generic apiCall handler will result in a 401
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bugs/:id', () => {
    it('should get a single bug entry', async () => {
      const bug = await BugEntry.create({ 
        userId: testUser._id, 
        title: 'Specific Bug', 
        status: 'open',
        aiPrompt: 'Why does this error occur?'
      });
      const res = await request(app)
        .get(`/api/bugs/${bug._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Specific Bug');
      expect(res.body.data.aiPrompt).toBe('Why does this error occur?');
    });
  });

  describe('PUT /api/bugs/:id', () => {
    it('should update a bug entry and maintain compatibility syncing', async () => {
      const bug = await BugEntry.create({ 
        userId: testUser._id, 
        title: 'Old Title', 
        status: 'open',
        rootCause: 'Original Cause',
        verifiedFinalFix: 'Original Fix',
        personalLearning: 'Original Learning',
        priority: 'low'
      });
      
      const res = await request(app)
        .put(`/api/bugs/${bug._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          title: 'New Title', 
          status: 'resolved',
          rootCause: 'New Cause',
          verifiedFinalFix: 'New Fix',
          personalLearning: 'New Learning',
          priority: 'high',
          relatedLinks: ['https://google.com']
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('New Title');
      expect(res.body.data.status).toBe('resolved');
      
      // Test compatibility syncing
      expect(res.body.data.rootCause).toBe('New Cause');
      expect(res.body.data.cause).toBe('New Cause');
      expect(res.body.data.verifiedFinalFix).toBe('New Fix');
      expect(res.body.data.solution).toBe('New Fix');
      expect(res.body.data.personalLearning).toBe('New Learning');
      expect(res.body.data.learningNotes).toBe('New Learning');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.severity).toBe('high');
      expect(res.body.data.relatedLinks).toContain('https://google.com');
    });
  });

  describe('DELETE /api/bugs/:id', () => {
    it('should delete a bug entry', async () => {
      const bug = await BugEntry.create({ userId: testUser._id, title: 'To Be Deleted', status: 'open' });
      const res = await request(app)
        .delete(`/api/bugs/${bug._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Bug entry deleted');
    });
  });
});