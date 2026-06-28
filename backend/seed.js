const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const BugEntry = require('./models/BugEntry');
const Prompt = require('./models/Prompt');

const MONGODB_URI = 'mongodb://localhost:27017/buglog';

async function seed() {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Clean existing database collections
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await BugEntry.deleteMany({});
    await Prompt.deleteMany({});

    // 2. Create demo user
    console.log('Creating demo user...');
    const demoUser = await User.create({
      name: 'Demo Developer',
      email: 'demo@example.com',
      password: 'password123'
    });

    console.log(`Demo user created with email: ${demoUser.email}`);

    // 3. Create mock Prompts
    console.log('Seeding mock prompts...');
    const prompts = [
      {
        userId: demoUser._id,
        title: 'React useEffect cleanup on WebSockets',
        prompt: 'Show me how to clean up WebSocket listeners in a React useEffect hook to avoid memory leaks when components unmount.',
        aiTool: 'Claude',
        category: 'React',
        effectivenessRating: 5,
        outcome: 'Correctly cleanup ws.close() and ws.onmessage listeners.',
        notes: 'Works best when using dependency arrays correctly.',
        aiSuggestion: 'Return a function in useEffect that removes event listeners or calls socket.close().',
        verifiedSolution: 'return () => { socket.close(); };',
        tags: ['react', 'websocket', 'memory-leak'],
        isFavorited: true
      },
      {
        userId: demoUser._id,
        title: 'Mongoose schema validation syntax',
        prompt: 'Mongoose missing brace error on nested schema validation: default is boolean but nested properties throw constructor error.',
        aiTool: 'Gemini',
        category: 'MongoDB',
        effectivenessRating: 4,
        outcome: 'Solved syntax brackets mismatch inside Mongoose schema setup.',
        notes: 'Double check comma separating nesting definitions.',
        aiSuggestion: 'Close the schema object definition correctly before the next field.',
        verifiedSolution: 'isAiVerified: { type: Boolean, default: false }, learningNotes: { ... }',
        tags: ['mongodb', 'mongoose', 'syntax'],
        isFavorited: false
      },
      {
        userId: demoUser._id,
        title: 'Stripe webhook validation failing',
        prompt: 'Why does Stripe webhook signature validation fail with 400 Bad Request? I am passing req.body directly in Express.',
        aiTool: 'ChatGPT',
        category: 'Payments',
        effectivenessRating: 5,
        outcome: 'Use express.raw() middleware instead of body-parser on webhook endpoint.',
        notes: 'Critical for payments integration.',
        aiSuggestion: 'Stripe needs the raw buffer (req.body) to compute the signature.',
        verifiedSolution: 'app.post("/webhook", express.raw({type: "application/json"}), ...)',
        tags: ['stripe', 'express', 'security'],
        isFavorited: true
      }
    ];

    await Prompt.insertMany(prompts);
    console.log('Seeded mock prompts successfully.');

    // 4. Create mock Bug entries
    console.log('Seeding mock bug entries...');
    const bugs = [
      {
        userId: demoUser._id,
        title: 'JWT token not invalidated on logout',
        errorMessage: 'Authorization failed: token remains valid in browser cache after logout action.',
        technology: 'Node.js',
        cause: 'Token remains valid because JWTs are stateless and the server does not track revoked tokens.',
        rootCause: 'Lack of token denylist or blacklist in Redis session database.',
        solution: 'Implemented a Redis denylist storing JWT JTI markers for the duration of the token TTL.',
        verifiedFinalFix: 'router.post("/logout", authenticate, async (req, res) => { await redis.setEx(`denylist:${req.user.jti}`, req.user.ttl, "revoked"); });',
        codeSnippet: `// Auth middleware revocation validation
const isRevoked = await redis.exists(\`denylist:\${decoded.jti}\`);
if (isRevoked) return res.status(401).json({ message: "Token revoked" });`,
        tags: ['auth', 'security', 'redis'],
        status: 'resolved',
        isFavorited: true,
        isAiVerified: true,
        learningNotes: 'Stateless JWTs need stateful blacklists (Redis) if active revocation is required.',
        personalLearning: 'Revoking stateless tokens requires tracking their unique identifiers (JTI) in a fast in-memory DB like Redis.',
        aiTool: 'Claude',
        aiPrompt: 'How do I invalidate a stateless JWT token on logout in Express?',
        aiSuggestedSolution: 'Use a Redis denylist to store the token id (jti) until it naturally expires, and check it on every request.',
        interviewExplanation: 'Faced a security flaw where logged-out users could still perform actions. Researched and applied a Redis-backed denylist. Explained stateless vs stateful auth tradeoffs.',
        priority: 'critical',
        severity: 'critical',
        dateSolved: new Date(),
        relatedLinks: ['https://redis.io/docs/manual/security/', 'https://jwt.io/introduction/'],
        githubRepo: 'demo/buglog',
        githubCommit: '9c8b7f3',
        githubIssue: '104',
        githubPR: '24'
      },
      {
        userId: demoUser._id,
        title: 'useEffect infinite loop on profile component',
        errorMessage: 'Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside useEffect.',
        technology: 'React',
        cause: 'Missing dependency array in useEffect caused profile fetches on every single render state change.',
        rootCause: 'useEffect ran on every component render, updated user profile state, triggered another render, creating a loop.',
        solution: 'Added user ID dependency to the useEffect hook dependency list array.',
        verifiedFinalFix: 'useEffect(() => { fetchProfile(userId); }, [userId]);',
        codeSnippet: `// Correct dependency hook inclusion
useEffect(() => {
  if (userId) {
    loadUserProfile(userId);
  }
}, [userId]);`,
        tags: ['react', 'loops', 'hooks'],
        status: 'resolved',
        isFavorited: false,
        isAiVerified: true,
        learningNotes: 'Always verify dependency list arguments inside useEffect to prevent unintended infinite renders.',
        personalLearning: 'Double-check react-hooks/exhaustive-deps lint warnings to catch missing dependencies early.',
        aiTool: 'Gemini',
        aiPrompt: 'React profile component crashes with maximum update depth exceeded loop.',
        aiSuggestedSolution: 'Supply a dependency array [userId] as the second argument to useEffect to restrict execution.',
        interviewExplanation: 'Debugged a profile rendering crash causing CPU throttling. Added a proper dependency hook array and discussed useEffect rendering lifecycles.',
        priority: 'high',
        severity: 'high',
        dateSolved: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        relatedLinks: ['https://react.dev/reference/react/useEffect'],
        githubRepo: 'demo/buglog-ui',
        githubCommit: 'a4e5f6c'
      },
      {
        userId: demoUser._id,
        title: 'Stripe webhook validation signature mismatch',
        errorMessage: 'StripeSignatureVerificationError: No valid signature found matching the payload.',
        technology: 'Express',
        cause: 'Using JSON parser body parser middleware before Stripe raw body signature verification validation.',
        rootCause: 'Stripe needs the raw buffer req.body to match the signed header signature correctly.',
        solution: 'Implemented express.raw() middleware specifically on the Stripe webhook route endpoint.',
        verifiedFinalFix: 'app.post("/webhook", express.raw({ type: "application/json" }), webhookHandler);',
        codeSnippet: `// Raw middleware route injection
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
});`,
        tags: ['stripe', 'express', 'payments'],
        status: 'resolved',
        isFavorited: true,
        isAiVerified: false,
        learningNotes: 'Stripe event signature generation fails if body parser has already modified body buffer stream.',
        personalLearning: 'Exempt Webhook routes from standard body JSON parsers in Express configurations.',
        aiTool: 'ChatGPT',
        aiPrompt: 'Why does Stripe constructEvent throw signature verification failed in my Node Express app?',
        aiSuggestedSolution: 'Stripe needs the raw request body. Exempt this route from app.use(express.json()) and use express.raw() instead.',
        interviewExplanation: 'Faced webhook 400 signature failures. Discovered standard parser body modifications. Restructured Express routing middlewares order.',
        priority: 'high',
        severity: 'high',
        dateSolved: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        relatedLinks: ['https://stripe.com/docs/webhooks/signatures'],
        githubRepo: 'demo/buglog-api',
        githubCommit: '1a2b3c4',
        githubIssue: '85'
      },
      {
        userId: demoUser._id,
        title: 'Mongoose schema validation nested brackets error',
        errorMessage: 'SyntaxError: Unexpected token default is boolean',
        technology: 'Node.js',
        cause: 'Missing closing curly brace on isAiVerified model definition inside BugEntry schema file.',
        rootCause: 'Mongoose schema configuration brackets mismatch caused parser parsing error.',
        solution: 'Added correct closing brace on isAiVerified validation definition.',
        verifiedFinalFix: 'isAiVerified: { type: Boolean, default: false }, learningNotes: { type: String, ... }',
        codeSnippet: `// Fixed mongoose schema entry definition
isAiVerified: {
  type: Boolean,
  default: false
},
learningNotes: {
  type: String
}`,
        tags: ['mongoose', 'syntax', 'javascript'],
        status: 'open',
        isFavorited: false,
        isAiVerified: false,
        learningNotes: 'Ensure brackets match in schema definitions.',
        personalLearning: 'Use IDE formatting tools or linters to immediately spot syntax/brace mismatches.',
        aiTool: 'Gemini',
        aiPrompt: 'SyntaxError: Unexpected token default is boolean in mongoose model setup.',
        aiSuggestedSolution: 'Close the preceding isAiVerified block properties definition using a curly brace before starting the next field.',
        interviewExplanation: 'Encountered compilation errors due to misplaced brackets in schema files. Resolved using syntax lint checking.',
        priority: 'low',
        severity: 'low',
        relatedLinks: ['https://mongoosejs.com/docs/guide.html']
      }
    ];

    await BugEntry.insertMany(bugs);
    console.log('Seeded mock bugs successfully.');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
