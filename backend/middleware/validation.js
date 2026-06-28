const { body, validationResult } = require('express-validator');

// Helper to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format errors as a readable string or return first error message
  const errorMsg = errors.array().map(err => err.msg).join(', ');
  return res.status(400).json({
    success: false,
    message: errorMsg,
  });
};

exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
];

exports.validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

exports.validateBug = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  body('githubRepo')
    .optional()
    .trim(),
  body('githubCommit')
    .optional()
    .trim(),
  body('githubIssue')
    .optional()
    .trim(),
  body('githubPR')
    .optional()
    .trim(),
  body('errorMessage')
    .optional()
    .trim(),
  body('technology')
    .optional()
    .trim(),
  body('cause')
    .optional()
    .trim(),
  body('solution')
    .optional()
    .trim(),
  body('codeSnippet')
    .optional(),
  body('learningNotes')
    .optional()
    .trim(),
  body('aiTool')
    .optional()
    .trim(),
  body('aiPrompt')
    .optional()
    .trim(),
  body('aiSuggestedSolution')
    .optional()
    .trim(),
  body('verifiedFinalFix')
    .optional()
    .trim(),
  body('personalLearning')
    .optional()
    .trim(),
  body('rootCause')
    .optional()
    .trim(),
  body('interviewExplanation')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority value'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity value'),
  body('dateSolved')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateSolved format'),
  body('relatedLinks')
    .optional()
    .isArray()
    .withMessage('relatedLinks must be an array of strings'),
  validate
];

exports.validatePrompt = [
  body('prompt')
    .trim()
    .notEmpty()
    .withMessage('Prompt text is required'),
  body('aiTool')
    .trim()
    .notEmpty()
    .withMessage('AI Tool is required'),
  body('effectivenessRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Effectiveness rating must be an integer between 1 and 5'),
  body('aiSuggestion')
    .optional()
    .trim(),
  body('verifiedSolution')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  body('isFavorited')
    .optional()
    .isBoolean()
    .withMessage('isFavorited must be a boolean value'),
  validate
];

exports.validateUpdateBug = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  body('githubRepo')
    .optional()
    .trim(),
  body('githubCommit')
    .optional()
    .trim(),
  body('githubIssue')
    .optional()
    .trim(),
  body('githubPR')
    .optional()
    .trim(),
  body('isAiVerified')
    .optional()
    .isBoolean()
    .withMessage('isAiVerified must be a boolean value'),
  body('errorMessage')
    .optional()
    .trim(),
  body('technology')
    .optional()
    .trim(),
  body('cause')
    .optional()
    .trim(),
  body('solution')
    .optional()
    .trim(),
  body('codeSnippet')
    .optional(),
  body('learningNotes')
    .optional()
    .trim(),
  body('aiTool')
    .optional()
    .trim(),
  body('aiPrompt')
    .optional()
    .trim(),
  body('aiSuggestedSolution')
    .optional()
    .trim(),
  body('verifiedFinalFix')
    .optional()
    .trim(),
  body('personalLearning')
    .optional()
    .trim(),
  body('rootCause')
    .optional()
    .trim(),
  body('interviewExplanation')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority value'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity value'),
  body('dateSolved')
    .optional()
    .isISO8601()
    .withMessage('Invalid dateSolved format'),
  body('relatedLinks')
    .optional()
    .isArray()
    .withMessage('relatedLinks must be an array of strings'),
  validate
];

exports.validateUpdatePrompt = [
  body('prompt')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Prompt text cannot be empty'),
  body('aiTool')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('AI Tool cannot be empty'),
  body('effectivenessRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Effectiveness rating must be an integer between 1 and 5'),
  body('aiSuggestion')
    .optional()
    .trim(),
  body('verifiedSolution')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  body('isFavorited')
    .optional()
    .isBoolean()
    .withMessage('isFavorited must be a boolean value'),
  validate
];
