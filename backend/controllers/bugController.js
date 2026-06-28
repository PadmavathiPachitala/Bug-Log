const BugEntry = require('../models/BugEntry');
const asyncHandler = require('../middleware/asyncHandler');
const PDFDocument = require('pdfkit');

// @desc    Get bug entries for logged-in user with server-side filtering and search
// @route   GET /api/bugs
exports.getBugs = asyncHandler(async (req, res) => {
  const { status, search, filter, technology, tag, startDate, endDate, favorites } = req.query;
  const query = { userId: req.user._id };

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9; // Using 9 for a 3x3 grid
  const skip = (page - 1) * limit;

  // Add status filter if provided
  if (status && ['open', 'resolved', 'in-progress', 'closed'].includes(status)) {
    query.status = status;
  }

  // Add technology filter
  if (technology) {
    query.technology = { $regex: technology, $options: 'i' };
  }

  // Add tag filter
  if (tag) {
    query.tags = tag;
  }
  if (req.query.tags) {
    const tagsArr = Array.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagsArr.length > 0) {
      query.tags = { $in: tagsArr };
    }
  }

  // Add favorites filter
  if (filter === 'favorites' || favorites === 'true' || req.query.isFavorited === 'true') {
    query.isFavorited = true;
  }

  // Add date filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Advanced Filters (Module 6)
  const priorityFilter = req.query.priority || req.query.severity;
  if (priorityFilter) {
    query.$or = [
      { priority: priorityFilter },
      { severity: priorityFilter }
    ];
  }
  if (req.query.aiTool) {
    query.aiTool = { $regex: req.query.aiTool, $options: 'i' };
  }

  // Add text search filter if provided
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { errorMessage: { $regex: search, $options: 'i' } },
      { technology: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { cause: { $regex: search, $options: 'i' } },
      { rootCause: { $regex: search, $options: 'i' } },
      { solution: { $regex: search, $options: 'i' } },
      { verifiedFinalFix: { $regex: search, $options: 'i' } },
      { learningNotes: { $regex: search, $options: 'i' } },
      { personalLearning: { $regex: search, $options: 'i' } },
      { aiPrompt: { $regex: search, $options: 'i' } },
      { interviewExplanation: { $regex: search, $options: 'i' } }
    ];
  }

  const totalBugs = await BugEntry.countDocuments(query);
  const bugs = await BugEntry.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: bugs.length,
    total: totalBugs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalBugs / limit),
    },
    data: bugs,
  });
});

// @desc    Export bugs to CSV, Markdown, or PDF
// @route   GET /api/bugs/export
// @access  Private
exports.exportBugs = asyncHandler(async (req, res) => {
  const { format, status, search, filter, technology, tag, startDate, endDate, favorites } = req.query;
  const query = { userId: req.user._id };

  // Apply filters
  if (status && ['open', 'resolved', 'in-progress', 'closed'].includes(status)) {
    query.status = status;
  }
  if (technology) {
    query.technology = { $regex: technology, $options: 'i' };
  }
  if (tag) {
    query.tags = tag;
  }
  if (req.query.tags) {
    const tagsArr = Array.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagsArr.length > 0) {
      query.tags = { $in: tagsArr };
    }
  }
  if (filter === 'favorites' || favorites === 'true' || req.query.isFavorited === 'true') {
    query.isFavorited = true;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Advanced Filters
  const priorityFilter = req.query.priority || req.query.severity;
  if (priorityFilter) {
    query.$or = [
      { priority: priorityFilter },
      { severity: priorityFilter }
    ];
  }
  if (req.query.aiTool) {
    query.aiTool = { $regex: req.query.aiTool, $options: 'i' };
  }

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { errorMessage: { $regex: search, $options: 'i' } },
      { technology: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { cause: { $regex: search, $options: 'i' } },
      { rootCause: { $regex: search, $options: 'i' } },
      { solution: { $regex: search, $options: 'i' } },
      { verifiedFinalFix: { $regex: search, $options: 'i' } },
      { learningNotes: { $regex: search, $options: 'i' } },
      { personalLearning: { $regex: search, $options: 'i' } },
      { aiPrompt: { $regex: search, $options: 'i' } },
      { interviewExplanation: { $regex: search, $options: 'i' } }
    ];
  }

  const bugs = await BugEntry.find(query).sort({ createdAt: -1 });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=buglog-export.csv');

    const headers = 'ID,Title,Status,Technology,Tags,Is Favorited,Created At,Updated At,Error Message,Cause,Solution,Learning Notes,Repo,Commit,Issue,PR,AI Tool,AI Prompt,AI Suggested Solution,Verified Final Fix,Personal Learning,Root Cause,Interview Explanation,Priority,Severity,Date Solved,Related Links\n';
    
    const escapeCSV = (val) => {
      if (val === undefined || val === null) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    let csvContent = headers;
    bugs.forEach(bug => {
      const row = [
        bug._id,
        bug.title,
        bug.status,
        bug.technology,
        (bug.tags || []).join('; '),
        bug.isFavorited ? 'true' : 'false',
        bug.createdAt.toISOString(),
        bug.updatedAt.toISOString(),
        bug.errorMessage,
        bug.cause,
        bug.solution,
        bug.learningNotes,
        bug.githubRepo,
        bug.githubCommit,
        bug.githubIssue,
        bug.githubPR,
        bug.aiTool,
        bug.aiPrompt,
        bug.aiSuggestedSolution,
        bug.verifiedFinalFix,
        bug.personalLearning,
        bug.rootCause,
        bug.interviewExplanation,
        bug.priority,
        bug.severity,
        bug.dateSolved ? bug.dateSolved.toISOString() : '',
        (bug.relatedLinks || []).join('; ')
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });

    return res.status(200).send(csvContent);

  } else if (format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename=buglog-export.md');

    let md = `# BugLog Export\nExported on: ${new Date().toLocaleString()}\nTotal Bugs: ${bugs.length}\n\n---\n\n`;

    bugs.forEach(bug => {
      md += `## [#${bug._id.toString().slice(-4)}] ${bug.title}\n`;
      md += `- **ID:** \`${bug._id}\`\n`;
      md += `- **Status:** \`${bug.status}\`\n`;
      md += `- **Priority:** \`${bug.priority}\`\n`;
      md += `- **Severity:** \`${bug.severity}\`\n`;
      md += `- **Technology:** ${bug.technology || 'N/A'}\n`;
      md += `- **Tags:** ${(bug.tags || []).map(t => `\`${t}\``).join(', ') || 'None'}\n`;
      md += `- **Favorited:** ${bug.isFavorited ? '★ Yes' : 'No'}\n`;
      if (bug.aiTool) md += `- **AI Tool Used:** ${bug.aiTool}\n`;
      if (bug.dateSolved) md += `- **Date Solved:** ${new Date(bug.dateSolved).toLocaleDateString()}\n`;
      if (bug.relatedLinks && bug.relatedLinks.length > 0) md += `- **Related Links:** ${bug.relatedLinks.join(', ')}\n`;
      if (bug.githubRepo) md += `- **GitHub Repo:** ${bug.githubRepo}\n`;
      if (bug.githubCommit) md += `- **GitHub Commit:** ${bug.githubCommit}\n`;
      if (bug.githubIssue) md += `- **GitHub Issue:** ${bug.githubIssue}\n`;
      if (bug.githubPR) md += `- **GitHub PR:** ${bug.githubPR}\n`;
      md += `- **Logged At:** ${bug.createdAt.toLocaleString()}\n\n`;

      if (bug.errorMessage) {
        md += `### Error Message\n\`\`\`text\n${bug.errorMessage}\n\`\`\`\n\n`;
      }
      if (bug.cause) {
        md += `### Root Cause\n${bug.cause}\n\n`;
      }
      if (bug.aiPrompt) {
        md += `### AI Prompt\n\`\`\`text\n${bug.aiPrompt}\n\`\`\`\n\n`;
      }
      if (bug.aiSuggestedSolution) {
        md += `### AI Suggested Solution\n\`\`\`text\n${bug.aiSuggestedSolution}\n\`\`\`\n\n`;
      }
      if (bug.solution) {
        md += `### Verified Solution\n${bug.solution}\n\n`;
        if (bug.codeSnippet) {
          md += `#### Code Snippet\n\`\`\`javascript\n${bug.codeSnippet}\n\`\`\`\n\n`;
        }
      }
      if (bug.learningNotes) {
        md += `### Learning Takeaways\n${bug.learningNotes}\n\n`;
      }
      if (bug.interviewExplanation) {
        md += `### Interview Explanation\n${bug.interviewExplanation}\n\n`;
      }
      md += `---\n\n`;
    });

    return res.status(200).send(md);

  } else if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=buglog-export.pdf');

    doc.pipe(res);

    // Title Page
    doc.fontSize(24).font('Helvetica-Bold').text('BugLog Journal Export', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Oblique').text(`Exported on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Total Bugs Logged: ${bugs.length}`, { align: 'center' });
    doc.moveDown(2);

    bugs.forEach((bug, index) => {
      if (index > 0) doc.addPage();

      doc.fontSize(16).font('Helvetica-Bold').text(`[#${bug._id.toString().slice(-4)}] ${bug.title}`);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('Metadata:');
      doc.font('Helvetica').text(`  • ID: ${bug._id}`);
      doc.text(`  • Status: ${bug.status}`);
      doc.text(`  • Priority / Severity: ${bug.priority} / ${bug.severity}`);
      doc.text(`  • Technology: ${bug.technology || 'N/A'}`);
      doc.text(`  • Tags: ${(bug.tags || []).join(', ') || 'None'}`);
      doc.text(`  • Favorited: ${bug.isFavorited ? 'Yes' : 'No'}`);
      if (bug.aiTool) doc.text(`  • AI Tool Used: ${bug.aiTool}`);
      if (bug.dateSolved) doc.text(`  • Date Solved: ${new Date(bug.dateSolved).toLocaleDateString()}`);
      if (bug.relatedLinks && bug.relatedLinks.length > 0) doc.text(`  • Related Links: ${bug.relatedLinks.join(', ')}`);
      if (bug.githubRepo) doc.text(`  • GitHub Link: ${bug.githubRepo}`);
      doc.moveDown(0.8);

      if (bug.errorMessage) {
        doc.fontSize(11).font('Helvetica-Bold').text('Error Message:');
        doc.fontSize(9).font('Courier').text(bug.errorMessage, { indent: 15 });
        doc.moveDown(0.8);
      }

      if (bug.cause) {
        doc.fontSize(11).font('Helvetica-Bold').text('Root Cause:');
        doc.fontSize(10).font('Helvetica').text(bug.cause, { indent: 15 });
        doc.moveDown(0.8);
      }

      if (bug.aiPrompt) {
        doc.fontSize(11).font('Helvetica-Bold').text('AI Prompt:');
        doc.fontSize(9).font('Courier').text(bug.aiPrompt, { indent: 15 });
        doc.moveDown(0.8);
      }

      if (bug.aiSuggestedSolution) {
        doc.fontSize(11).font('Helvetica-Bold').text('AI Suggested Solution:');
        doc.fontSize(9).font('Courier').text(bug.aiSuggestedSolution, { indent: 15 });
        doc.moveDown(0.8);
      }

      if (bug.solution) {
        doc.fontSize(11).font('Helvetica-Bold').text('Verified Solution:');
        doc.fontSize(10).font('Helvetica').text(bug.solution, { indent: 15 });
        doc.moveDown(0.5);
        if (bug.codeSnippet) {
          doc.fontSize(9).font('Courier').text(bug.codeSnippet, { indent: 20 });
          doc.moveDown(0.8);
        }
      }

      if (bug.learningNotes) {
        doc.fontSize(11).font('Helvetica-Bold').text('Learning Notes:');
        doc.fontSize(10).font('Helvetica').text(bug.learningNotes, { indent: 15 });
        doc.moveDown(0.8);
      }

      if (bug.interviewExplanation) {
        doc.fontSize(11).font('Helvetica-Bold').text('Interview Explanation:');
        doc.fontSize(10).font('Helvetica').text(bug.interviewExplanation, { indent: 15 });
      }
    });

    doc.end();
    return;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid format. Supported: csv, markdown, pdf' });
  }
});

const generateHeuristicAiSuggestion = (bug) => {
  const title = (bug.title || '').toLowerCase();
  const error = (bug.errorMessage || '').toLowerCase();
  const tech = (bug.technology || '').toLowerCase();

  if (title.includes('cors') || error.includes('cors') || error.includes('access-control-allow-origin')) {
    return {
      description: "Initialize the CORS middleware on the backend to allow requests from the frontend origin, and set credentials to true to accept cookie-based sessions.",
      code: `// Express CORS setup\nconst corsOptions = {\n  origin: 'http://localhost:8080',\n  credentials: true\n};\napp.use(cors(corsOptions));`
    };
  }

  if (title.includes('jwt') || title.includes('auth') || error.includes('jwt') || error.includes('token')) {
    return {
      description: "Extract the Bearer token or cookie-based JWT correctly on incoming requests, verify it using the sign key, and check if it is active.",
      code: `// Middleware auth handler\nconst protect = asyncHandler(async (req, res, next) => {\n  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;\n  if (!token) return res.status(401).json({ message: 'Not authorized' });\n  const decoded = jwt.verify(token, process.env.JWT_SECRET);\n  req.user = await User.findById(decoded.id).select('-password');\n  next();\n});`
    };
  }

  if (title.includes('useeffect') || title.includes('loop') || error.includes('useeffect') || tech.includes('react')) {
    return {
      description: "To prevent infinite re-render loops in React components, ensure that you provide a proper dependency array as the second parameter to useEffect.",
      code: `// useEffect with dependency array\nuseEffect(() => {\n  const fetchData = async () => {\n    const data = await getBugs();\n    setBugs(data);\n  };\n  fetchData();\n}, []); // <-- Empty array runs once on mount`
    };
  }

  if (title.includes('n+1') || title.includes('query') || error.includes('query') || error.includes('n+1')) {
    return {
      description: "Avoid looping over parent elements to run individual query fetches for child associations. Use database joins or populate parent records in a single query.",
      code: `// Eager loading populate query (Mongoose)\nconst bugs = await BugEntry.find(query)\n  .populate('userId')\n  .sort({ createdAt: -1 });`
    };
  }

  return {
    description: `Verify that variables are properly initialized and null-pointer checks are applied when handling properties in ${bug.technology || 'this tech stack'}. Check stack trace logs for line number details.`,
    code: `// Safe optional chaining & null checks\nconst value = data?.details?.property || 'default_value';\nif (value === 'default_value') {\n  console.warn('Property was not found in data payload');\n}`
  };
};

// @desc    Get single bug entry
// @route   GET /api/bugs/:id
exports.getBug = asyncHandler(async (req, res) => {
  const bug = await BugEntry.findOne({ _id: req.params.id, userId: req.user._id });

  if (!bug) {
    return res.status(404).json({ success: false, message: 'Bug entry not found' });
  }

  const suggestion = generateHeuristicAiSuggestion(bug);
  const bugObj = bug.toObject();
  bugObj.aiSuggestion = bug.aiSuggestedSolution || suggestion.description;
  bugObj.aiSuggestionCode = bug.aiSuggestedSolution ? '' : suggestion.code;

  res.status(200).json({ success: true, data: bugObj });
});

// @desc    Create bug entry
// @route   POST /api/bugs
exports.createBug = asyncHandler(async (req, res) => {
  const { 
    title, 
    errorMessage, 
    technology, 
    cause, 
    solution, 
    codeSnippet, 
    tags, 
    status, 
    learningNotes,
    githubRepo,
    githubCommit,
    githubIssue,
    githubPR,
    aiTool,
    aiPrompt,
    aiSuggestedSolution,
    verifiedFinalFix,
    personalLearning,
    rootCause,
    interviewExplanation,
    priority,
    severity,
    dateSolved,
    relatedLinks
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const finalRootCause = rootCause || cause || '';
  const finalVerifiedFix = verifiedFinalFix || solution || '';
  const finalPersonalLearning = personalLearning || learningNotes || '';
  const finalPriority = priority || severity || 'low';
  const finalSeverity = severity || priority || 'low';

  const bug = await BugEntry.create({
    userId: req.user._id,
    title,
    errorMessage,
    technology,
    cause: finalRootCause,
    rootCause: finalRootCause,
    solution: finalVerifiedFix,
    verifiedFinalFix: finalVerifiedFix,
    codeSnippet,
    tags,
    status: status || 'open',
    learningNotes: finalPersonalLearning,
    personalLearning: finalPersonalLearning,
    githubRepo,
    githubCommit,
    githubIssue,
    githubPR,
    aiTool,
    aiPrompt,
    aiSuggestedSolution,
    interviewExplanation,
    priority: finalPriority,
    severity: finalSeverity,
    dateSolved,
    relatedLinks
  });

  res.status(201).json({ success: true, message: 'Bug entry created', data: bug });
});

// @desc    Update bug entry
// @route   PUT /api/bugs/:id
exports.updateBug = asyncHandler(async (req, res) => {
  const updatableFields = [
    'title',
    'errorMessage',
    'technology',
    'cause',
    'solution',
    'codeSnippet',
    'tags',
    'status',
    'learningNotes',
    'githubRepo',
    'githubCommit',
    'githubIssue',
    'githubPR',
    'isAiVerified',
    'aiTool',
    'aiPrompt',
    'aiSuggestedSolution',
    'verifiedFinalFix',
    'personalLearning',
    'rootCause',
    'interviewExplanation',
    'priority',
    'severity',
    'dateSolved',
    'relatedLinks'
  ];

  const updateData = {};
  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Ensure backward compatibility syncing
  const finalRootCause = req.body.rootCause !== undefined ? req.body.rootCause : req.body.cause;
  if (finalRootCause !== undefined) {
    updateData.rootCause = finalRootCause;
    updateData.cause = finalRootCause;
  }
  const finalVerifiedFix = req.body.verifiedFinalFix !== undefined ? req.body.verifiedFinalFix : req.body.solution;
  if (finalVerifiedFix !== undefined) {
    updateData.verifiedFinalFix = finalVerifiedFix;
    updateData.solution = finalVerifiedFix;
  }
  const finalPersonalLearning = req.body.personalLearning !== undefined ? req.body.personalLearning : req.body.learningNotes;
  if (finalPersonalLearning !== undefined) {
    updateData.personalLearning = finalPersonalLearning;
    updateData.learningNotes = finalPersonalLearning;
  }
  const finalPriority = req.body.priority !== undefined ? req.body.priority : req.body.severity;
  if (finalPriority !== undefined) {
    updateData.priority = finalPriority;
    updateData.severity = finalPriority;
  }
  const finalSeverity = req.body.severity !== undefined ? req.body.severity : req.body.priority;
  if (finalSeverity !== undefined) {
    updateData.severity = finalSeverity;
    updateData.priority = finalSeverity;
  }

  const bug = await BugEntry.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!bug) {
    return res.status(404).json({ success: false, message: 'Bug entry not found' });
  }

  res.status(200).json({ success: true, message: 'Bug entry updated', data: bug });
});

// @desc    Delete bug entry
// @route   DELETE /api/bugs/:id
exports.deleteBug = asyncHandler(async (req, res) => {
  const bug = await BugEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

  if (!bug) {
    return res.status(404).json({ success: false, message: 'Bug entry not found' });
  }

  res.status(200).json({ success: true, message: 'Bug entry deleted' });
});

// @desc    Toggle favorite status for a bug entry
// @route   PATCH /api/bugs/:id/favorite
exports.toggleFavorite = asyncHandler(async (req, res) => {
  const bug = await BugEntry.findOne({ _id: req.params.id, userId: req.user._id });

  if (!bug) {
    return res.status(404).json({ success: false, message: 'Bug entry not found' });
  }

  bug.isFavorited = !bug.isFavorited;
  await bug.save();

  res.status(200).json({
    success: true,
    message: `Bug entry ${bug.isFavorited ? 'favorited' : 'unfavorited'}`,
    data: bug,
  });
});
