const mongoose = require('mongoose');

const bugEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    errorMessage: {
      type: String,
      default: '',
      trim: true,
    },
    technology: {
      type: String,
      default: '',
      trim: true,
    },
    cause: {
      type: String,
      default: '',
      trim: true,
    },
    solution: {
      type: String,
      default: '',
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    isFavorited: {
      type: Boolean,
      default: false,
    },
    isAiVerified: {
      type: Boolean,
      default: false,
    },
    learningNotes: {
      type: String,
      default: '',
      trim: true,
    },
    githubRepo: {
      type: String,
      default: '',
      trim: true,
    },
    githubCommit: {
      type: String,
      default: '',
      trim: true,
    },
    githubIssue: {
      type: String,
      default: '',
      trim: true,
    },
    githubPR: {
      type: String,
      default: '',
      trim: true,
    },
    aiTool: {
      type: String,
      default: '',
      trim: true,
    },
    aiPrompt: {
      type: String,
      default: '',
      trim: true,
    },
    aiSuggestedSolution: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedFinalFix: {
      type: String,
      default: '',
      trim: true,
    },
    personalLearning: {
      type: String,
      default: '',
      trim: true,
    },
    rootCause: {
      type: String,
      default: '',
      trim: true,
    },
    interviewExplanation: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    dateSolved: {
      type: Date,
    },
    relatedLinks: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Add indexes for frequently queried fields
bugEntrySchema.index({ userId: 1 });
bugEntrySchema.index({ userId: 1, status: 1 });
bugEntrySchema.index({ userId: 1, isFavorited: 1 });
bugEntrySchema.index({ userId: 1, technology: 1 });
bugEntrySchema.index({ userId: 1, tags: 1 });
bugEntrySchema.index({ userId: 1, priority: 1 });
bugEntrySchema.index({ userId: 1, severity: 1 });
bugEntrySchema.index({ userId: 1, aiTool: 1 });

// Text index for server-side full text search
bugEntrySchema.index({
  title: 'text',
  errorMessage: 'text',
  technology: 'text',
  cause: 'text',
  solution: 'text',
  learningNotes: 'text',
  aiPrompt: 'text',
  rootCause: 'text',
  verifiedFinalFix: 'text',
  personalLearning: 'text',
  interviewExplanation: 'text'
}, {
  weights: {
    title: 10,
    errorMessage: 5,
    technology: 3,
    cause: 3,
    solution: 3,
    learningNotes: 2,
    aiPrompt: 4,
    rootCause: 4,
    verifiedFinalFix: 4,
    personalLearning: 3,
    interviewExplanation: 4
  },
  name: 'BugTextSearchIndex'
});

module.exports = mongoose.model('BugEntry', bugEntrySchema);
