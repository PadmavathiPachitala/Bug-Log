const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prompt: {
      type: String,
      required: [true, 'Prompt text is required'],
      trim: true,
    },
    aiTool: {
      type: String,
      required: [true, 'AI Tool is required'],
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    effectivenessRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 3,
    },
    outcome: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: String,
      default: '',
      trim: true,
    },
    aiSuggestion: {
      type: String,
      default: '',
      trim: true,
    },
    verifiedSolution: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add indexes for quick querying and text searching
promptSchema.index({ userId: 1 });
promptSchema.index({ userId: 1, category: 1 });
promptSchema.index({ userId: 1, effectivenessRating: 1 });
promptSchema.index({ userId: 1, isFavorited: 1 });
promptSchema.index({ userId: 1, tags: 1 });

promptSchema.index({
  prompt: 'text',
  aiTool: 'text',
  category: 'text',
  outcome: 'text',
  notes: 'text',
  aiSuggestion: 'text',
  verifiedSolution: 'text',
  tags: 'text'
}, {
  weights: {
    prompt: 10,
    category: 5,
    aiTool: 3,
    notes: 2,
    outcome: 2,
    aiSuggestion: 3,
    verifiedSolution: 3,
    tags: 2
  },
  name: 'PromptTextSearchIndex'
});

module.exports = mongoose.model('Prompt', promptSchema);
