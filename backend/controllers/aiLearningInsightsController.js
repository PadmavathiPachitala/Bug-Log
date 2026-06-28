const BugEntry = require('../models/BugEntry');
const asyncHandler = require('../middleware/asyncHandler');

// Heuristic analysis function (Clean architecture - can be replaced with an LLM call later)
const analyzeInsights = (bugs) => {
  if (!bugs || bugs.length === 0) {
    return {
      bugsSolvedThisWeek: 0,
      mostCommonTechnologies: [],
      mostCommonMistakes: [],
      strongestAreas: [],
      weakestAreas: [],
      suggestedLearningTopics: ['Introduction to Debugging', 'Structured Bug Tracking']
    };
  }

  // 1. Bugs solved this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const bugsSolvedThisWeek = bugs.filter(b => b.status === 'resolved' && new Date(b.updatedAt) >= oneWeekAgo).length;

  // 2. Most common technologies
  const techCounts = {};
  bugs.forEach(b => {
    if (b.technology) {
      const tech = b.technology.trim();
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    }
  });
  const mostCommonTechnologies = Object.entries(techCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Most common mistakes (Keyword analysis of cause and errorMessage)
  const mistakeKeywords = [
    { name: 'CORS & Cross-Origin Requests', keywords: ['cors', 'origin', 'access-control', 'cross-origin'] },
    { name: 'JWT & Authentication Session Errors', keywords: ['jwt', 'token', 'auth', 'login', 'logout', 'session', 'bcrypt', 'unauthorized'] },
    { name: 'Null Pointer & Type Mismatches', keywords: ['null', 'undefined', 'typeerror', 'cannot read property', 'nan', 'referenceerror'] },
    { name: 'Infinite Loops & React Hook Dependencies', keywords: ['loop', 'infinite', 'useeffect', 'dependency', 're-render', 'hooks'] },
    { name: 'Database Query Overhead (N+1)', keywords: ['n+1', 'query', 'postgres', 'mongo', 'sql', 'database', 'findbyid', 'orm'] },
    { name: 'CSS & Mobile Layout Clipping', keywords: ['css', 'responsive', 'overlap', 'viewport', 'mobile', 'layout', 'style', 'width'] },
    { name: 'Memory Leaks & Event Listeners', keywords: ['memory', 'leak', 'websocket', 'socket.io', 'event listener', 'disconnect'] }
  ];

  const mistakeCounts = {};
  bugs.forEach(b => {
    const textToSearch = `${b.title} ${b.errorMessage} ${b.cause} ${(b.tags || []).join(' ')}`.toLowerCase();
    mistakeKeywords.forEach(m => {
      const matches = m.keywords.some(k => textToSearch.includes(k));
      if (matches) {
        mistakeCounts[m.name] = (mistakeCounts[m.name] || 0) + 1;
      }
    });
  });

  const mostCommonMistakes = Object.entries(mistakeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Strongest vs Weakest areas (Resolution rate by technology)
  const techPerformance = {};
  bugs.forEach(b => {
    if (b.technology) {
      const tech = b.technology.trim();
      if (!techPerformance[tech]) {
        techPerformance[tech] = { total: 0, resolved: 0 };
      }
      techPerformance[tech].total++;
      if (b.status === 'resolved') {
        techPerformance[tech].resolved++;
      }
    }
  });

  const strongestAreas = [];
  const weakestAreas = [];

  Object.entries(techPerformance).forEach(([tech, perf]) => {
    const rate = perf.resolved / perf.total;
    if (rate >= 0.7) {
      strongestAreas.push({ name: tech, resolutionRate: Math.round(rate * 100) });
    } else {
      weakestAreas.push({ name: tech, resolutionRate: Math.round(rate * 100), openBugs: perf.total - perf.resolved });
    }
  });

  strongestAreas.sort((a, b) => b.resolutionRate - a.resolutionRate);
  weakestAreas.sort((a, b) => a.resolutionRate - b.resolutionRate);

  // 5. Suggested learning topics based on Weakest Areas and Common Mistakes
  const topicMap = {
    'CORS & Cross-Origin Requests': 'Deep Dive into Web Security: CORS, CSP, and Headers',
    'JWT & Authentication Session Errors': 'Secure Token Authentication, Refresh Tokens, and Cookie Security',
    'Null Pointer & Type Mismatches': 'TypeScript Essentials: Handling Nullish States and Type Safety',
    'Infinite Loops & React Hook Dependencies': 'Advanced React: useEffect, Dependency Arrays, and Render Cycles',
    'Database Query Overhead (N+1)': 'Query Optimization: Fixing N+1 Queries with Joins & Populates',
    'CSS & Mobile Layout Clipping': 'Modern CSS Layouts: Flexbox, Grid, and Fluid Responsiveness',
    'Memory Leaks & Event Listeners': 'Node.js Performance: Memory Profiling and Clean Event Handling'
  };

  const suggestedLearningTopics = [];
  
  // Add suggestions from common mistakes
  mostCommonMistakes.slice(0, 3).forEach(m => {
    if (topicMap[m.name]) {
      suggestedLearningTopics.push(topicMap[m.name]);
    }
  });

  // Add suggestions from weak areas
  weakestAreas.slice(0, 2).forEach(w => {
    suggestedLearningTopics.push(`Core Patterns in ${w.name}: Optimization and Troubleshooting`);
  });

  // Default fallbacks if list is short
  if (suggestedLearningTopics.length < 2) {
    suggestedLearningTopics.push('Writing Effective Integration Tests');
    suggestedLearningTopics.push('Advanced Debugging Tools & Profiling');
  }

  // Ensure unique topics
  const uniqueTopics = [...new Set(suggestedLearningTopics)];

  return {
    bugsSolvedThisWeek,
    mostCommonTechnologies: mostCommonTechnologies.slice(0, 5),
    mostCommonMistakes: mostCommonMistakes.slice(0, 5),
    strongestAreas: strongestAreas.slice(0, 3),
    weakestAreas: weakestAreas.slice(0, 3),
    suggestedLearningTopics: uniqueTopics.slice(0, 5)
  };
};

// @desc    Get AI-assisted heuristic learning insights
// @route   GET /api/learning-insights
// @access  Private
exports.getLearningInsights = asyncHandler(async (req, res) => {
  const bugs = await BugEntry.find({ userId: req.user._id });
  const insights = analyzeInsights(bugs);

  // Generate dynamic heuristic sentence insights (Module 4)
  const sentences = [];

  // 1. You solved X [Technology] bugs
  if (insights.mostCommonTechnologies && insights.mostCommonTechnologies.length > 0) {
    const topTech = insights.mostCommonTechnologies[0].name;
    const resolvedCount = bugs.filter(b => b.technology === topTech && b.status === 'resolved').length;
    sentences.push(`You solved ${resolvedCount} ${topTech} bugs.`);
  } else {
    sentences.push("You solved 0 bugs in any single technology yet.");
  }

  // 2. [Topic] is your strongest topic
  if (insights.strongestAreas && insights.strongestAreas.length > 0) {
    sentences.push(`${insights.strongestAreas[0].name} is your strongest topic.`);
  } else {
    sentences.push("Log and resolve more bugs to discover your strongest topic.");
  }

  // 3. [Issue] is your most common issue
  if (insights.mostCommonMistakes && insights.mostCommonMistakes.length > 0) {
    let mistakeShortName = insights.mostCommonMistakes[0].name;
    sentences.push(`${mistakeShortName} is your most common issue.`);
  } else {
    sentences.push("No common recurring issues discovered yet.");
  }

  // 4. You frequently use [AI Tool] for [frontend/backend] debugging
  const aiToolCounts = {};
  bugs.forEach(b => {
    if (b.aiTool) {
      aiToolCounts[b.aiTool] = (aiToolCounts[b.aiTool] || 0) + 1;
    }
  });
  const topAiTool = Object.entries(aiToolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'AI assistants';
  
  let areaType = 'backend';
  if (insights.mostCommonTechnologies && insights.mostCommonTechnologies.length > 0) {
    const tech = insights.mostCommonTechnologies[0].name.toLowerCase();
    if (['react', 'html', 'css', 'javascript', 'vue', 'angular', 'frontend'].some(f => tech.includes(f))) {
      areaType = 'frontend';
    }
  }
  sentences.push(`You frequently use ${topAiTool} for ${areaType} debugging.`);

  // 5. Suggested topic to study: [Topic]
  if (insights.suggestedLearningTopics && insights.suggestedLearningTopics.length > 0) {
    sentences.push(`Suggested topic to study: ${insights.suggestedLearningTopics[0]}.`);
  } else {
    sentences.push("Suggested topic to study: Writing Effective Integration Tests.");
  }

  res.status(200).json({
    success: true,
    data: {
      ...insights,
      sentences
    }
  });
});
