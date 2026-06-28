const Prompt = require('../models/Prompt');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all prompts (paginated, filterable, searchable)
// @route   GET /api/prompts
// @access  Private
exports.getPrompts = asyncHandler(async (req, res) => {
  const { category, aiTool, search, rating, sort, tag, isFavorited } = req.query;
  const query = { userId: req.user._id };

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Filters
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }
  if (aiTool) {
    query.aiTool = { $regex: aiTool, $options: 'i' };
  }
  if (rating) {
    query.effectivenessRating = { $gte: parseInt(rating, 10) };
  }
  if (tag) {
    query.tags = tag;
  }
  if (isFavorited === 'true' || req.query.filter === 'favorites') {
    query.isFavorited = true;
  }

  // Search
  if (search) {
    query.$or = [
      { prompt: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { aiTool: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { outcome: { $regex: search, $options: 'i' } },
      { aiSuggestion: { $regex: search, $options: 'i' } },
      { verifiedSolution: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Sorting
  let sortBy = { createdAt: -1 };
  if (sort === 'rating-desc') {
    sortBy = { effectivenessRating: -1, createdAt: -1 };
  } else if (sort === 'rating-asc') {
    sortBy = { effectivenessRating: 1, createdAt: -1 };
  }

  const total = await Prompt.countDocuments(query);
  const prompts = await Prompt.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: prompts.length,
    total,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    },
    data: prompts,
  });
});

// @desc    Get single prompt
// @route   GET /api/prompts/:id
// @access  Private
exports.getPrompt = asyncHandler(async (req, res) => {
  const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.user._id });

  if (!prompt) {
    return res.status(404).json({ success: false, message: 'Prompt not found' });
  }

  res.status(200).json({ success: true, data: prompt });
});

// @desc    Create prompt
// @route   POST /api/prompts
// @access  Private
exports.createPrompt = asyncHandler(async (req, res) => {
  const { prompt, aiTool, category, effectivenessRating, outcome, notes, createdBy, aiSuggestion, verifiedSolution, tags, isFavorited } = req.body;

  if (!prompt || !aiTool) {
    return res.status(400).json({ success: false, message: 'Prompt and AI Tool are required' });
  }

  const newPrompt = await Prompt.create({
    userId: req.user._id,
    prompt,
    aiTool,
    category,
    effectivenessRating,
    outcome,
    notes,
    createdBy: createdBy || req.user.name,
    aiSuggestion,
    verifiedSolution,
    tags,
    isFavorited
  });

  res.status(201).json({ success: true, message: 'Prompt created successfully', data: newPrompt });
});

// @desc    Update prompt
// @route   PUT /api/prompts/:id
// @access  Private
exports.updatePrompt = asyncHandler(async (req, res) => {
  const updatableFields = [
    'prompt',
    'aiTool',
    'category',
    'effectivenessRating',
    'outcome',
    'notes',
    'createdBy',
    'aiSuggestion',
    'verifiedSolution',
    'tags',
    'isFavorited'
  ];

  const updateData = {};
  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const prompt = await Prompt.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!prompt) {
    return res.status(404).json({ success: false, message: 'Prompt not found' });
  }

  res.status(200).json({ success: true, message: 'Prompt updated successfully', data: prompt });
});

// @desc    Delete prompt
// @route   DELETE /api/prompts/:id
// @access  Private
exports.deletePrompt = asyncHandler(async (req, res) => {
  const prompt = await Prompt.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

  if (!prompt) {
    return res.status(404).json({ success: false, message: 'Prompt not found' });
  }

  res.status(200).json({ success: true, message: 'Prompt deleted successfully' });
});

// @desc    Toggle favorite status for a prompt entry
// @route   PATCH /api/prompts/:id/favorite
// @access  Private
exports.toggleFavoritePrompt = asyncHandler(async (req, res) => {
  const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.user._id });

  if (!prompt) {
    return res.status(404).json({ success: false, message: 'Prompt not found' });
  }

  prompt.isFavorited = !prompt.isFavorited;
  await prompt.save();

  res.status(200).json({
    success: true,
    message: `Prompt ${prompt.isFavorited ? 'favorited' : 'unfavorited'}`,
    data: prompt,
  });
});
