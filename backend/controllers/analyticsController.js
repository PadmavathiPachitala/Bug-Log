const BugEntry = require('../models/BugEntry');
const Prompt = require('../models/Prompt');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get bug statistics and metrics for the dashboard
// @route   GET /api/analytics
// @access  Private
exports.getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Basic Stats (Total, status counts, favorites)
  const statsResult = await BugEntry.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        favorites: { $sum: { $cond: [{ $eq: ['$isFavorited', true] }, 1, 0] } }
      }
    }
  ]);

  const stats = statsResult[0] || {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    favorites: 0
  };

  // 2. Bugs by Technology
  const techBreakdown = await BugEntry.aggregate([
    { $match: { userId, technology: { $ne: null, $ne: '' } } },
    { $group: { _id: '$technology', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 3. Top Tags
  const tagBreakdown = await BugEntry.aggregate([
    { $match: { userId } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // 4. Monthly Trends (bug creation count per month)
  const monthlyTrends = await BugEntry.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  // Format monthly trends for easier chart parsing
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyTrends = monthlyTrends.map(item => ({
    label: `${months[item._id.month - 1]} ${item._id.year}`,
    count: item.count
  }));

  // 5. Weekly Trends (bug creation count per week)
  const weeklyTrends = await BugEntry.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
    { $limit: 8 }
  ]);

  const formattedWeeklyTrends = weeklyTrends.map(item => ({
    label: `Week ${item._id.week}, ${item._id.year}`,
    count: item.count
  }));

  // 6. Recently Fixed Bugs
  const recentlyFixed = await BugEntry.find({ userId, status: 'resolved' })
    .sort({ updatedAt: -1 })
    .limit(5);

  // 7. Most Common Error (Module 3)
  const commonErrors = await BugEntry.aggregate([
    { $match: { userId, errorMessage: { $ne: null, $ne: '' } } },
    { $group: { _id: '$errorMessage', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  const mostCommonError = commonErrors[0]?._id ? (commonErrors[0]._id.split('\n')[0].slice(0, 80)) : 'None';

  // 8. Most Used AI Tool (Module 3)
  const bugAiTools = await BugEntry.aggregate([
    { $match: { userId, aiTool: { $ne: null, $ne: '' } } },
    { $group: { _id: '$aiTool', count: { $sum: 1 } } }
  ]);
  const promptAiTools = await Prompt.aggregate([
    { $match: { userId, aiTool: { $ne: null, $ne: '' } } },
    { $group: { _id: '$aiTool', count: { $sum: 1 } } }
  ]);
  
  const aiToolCounts = {};
  bugAiTools.forEach(t => { aiToolCounts[t._id] = (aiToolCounts[t._id] || 0) + t.count; });
  promptAiTools.forEach(t => { aiToolCounts[t._id] = (aiToolCounts[t._id] || 0) + t.count; });
  const sortedAiTools = Object.entries(aiToolCounts).sort((a, b) => b[1] - a[1]);
  const mostUsedAiTool = sortedAiTools[0]?.[0] || 'None';

  // 9. Prompt Effectiveness (Module 3)
  const promptStats = await Prompt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$effectivenessRating' }
      }
    }
  ]);
  const promptEffectiveness = promptStats[0] ? Math.round(promptStats[0].avgRating * 10) / 10 : 0;

  // 10. Learning Progress (Module 3)
  const learningProgress = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        total: stats.total,
        open: stats.open,
        inProgress: stats.inProgress,
        resolved: stats.resolved,
        closed: stats.closed,
        favorites: stats.favorites,
        mostCommonError,
        mostUsedAiTool,
        promptEffectiveness,
        learningProgress
      },
      technologyDistribution: techBreakdown,
      topTags: tagBreakdown,
      monthlyTrends: formattedMonthlyTrends,
      weeklyTrends: formattedWeeklyTrends,
      recentlyFixed
    }
  });
});
