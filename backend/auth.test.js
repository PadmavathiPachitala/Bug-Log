const request = require('supertest');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('./models/User');

// Mock the asyncHandler to directly execute the function and catch errors
jest.mock('./middleware/asyncHandler', () => fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail if email is already registered', async () => {
      await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Another User', email: 'test@example.com', password: 'password456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    });

    it('should login an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data).toHaveProperty('token');
    });
  });
});