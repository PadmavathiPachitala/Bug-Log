const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const promptRoutes = require('./routes/promptRoutes');
const User = require('./models/User');
const Prompt = require('./models/Prompt');
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
app.use('/api/prompts', promptRoutes);

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
  await Prompt.deleteMany({});

  testUser = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
  token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

describe('Prompts API', () => {
  describe('POST /api/prompts', () => {
    it('should create a new prompt entry', async () => {
      const res = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Write a quicksort in JavaScript',
          aiTool: 'Gemini 2.5 Flash',
          category: 'Algorithms',
          effectivenessRating: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prompt).toBe('Write a quicksort in JavaScript');
      expect(res.body.data.userId.toString()).toBe(testUser._id.toString());
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Algorithms'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/prompts', () => {
    it('should retrieve all prompts for the logged-in user', async () => {
      await Prompt.create({
        userId: testUser._id,
        prompt: 'Prompt 1',
        aiTool: 'Gemini',
        category: 'Test'
      });
      await Prompt.create({
        userId: testUser._id,
        prompt: 'Prompt 2',
        aiTool: 'Claude',
        category: 'Test'
      });

      const res = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/prompts/:id', () => {
    it('should retrieve a single prompt by id', async () => {
      const prompt = await Prompt.create({
        userId: testUser._id,
        prompt: 'Specific Prompt',
        aiTool: 'Gemini',
        category: 'Lookup'
      });

      const res = await request(app)
        .get(`/api/prompts/${prompt._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prompt).toBe('Specific Prompt');
    });
  });

  describe('PUT /api/prompts/:id', () => {
    it('should update a prompt entry', async () => {
      const prompt = await Prompt.create({
        userId: testUser._id,
        prompt: 'Old Prompt',
        aiTool: 'Gemini'
      });

      const res = await request(app)
        .put(`/api/prompts/${prompt._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'New Prompt',
          effectivenessRating: 4
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prompt).toBe('New Prompt');
      expect(res.body.data.effectivenessRating).toBe(4);
    });
  });

  describe('PATCH /api/prompts/:id/favorite', () => {
    it('should toggle favorite status of a prompt', async () => {
      const prompt = await Prompt.create({
        userId: testUser._id,
        prompt: 'To Be Favorited',
        aiTool: 'Gemini',
        isFavorited: false
      });

      const res = await request(app)
        .patch(`/api/prompts/${prompt._id}/favorite`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFavorited).toBe(true);

      // Toggle back to false
      const res2 = await request(app)
        .patch(`/api/prompts/${prompt._id}/favorite`)
        .set('Authorization', `Bearer ${token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data.isFavorited).toBe(false);
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    it('should delete a prompt entry', async () => {
      const prompt = await Prompt.create({
        userId: testUser._id,
        prompt: 'To Be Deleted',
        aiTool: 'Gemini'
      });

      const res = await request(app)
        .delete(`/api/prompts/${prompt._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Prompt deleted successfully');
    });
  });
});
