const { Book, Member, Transaction } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/response');

exports.getStats = catchAsync(async (req, res, next) => {
  const today = new Date();

  // 1. Core KPIs
  const totalBooks = await Book.countDocuments();
  const totalMembers = await Member.countDocuments();
  
  const activeLoans = await Transaction.countDocuments({
    status: 'issued',
    returnDate: null
  });

  const overdueLoansList = await Transaction.find({
    status: 'issued',
    returnDate: null,
    dueDate: { $lt: today }
  })
    .populate('bookId', 'title author')
    .populate('memberId', 'name email membershipId')
    .sort({ dueDate: 1 });

  const overdueLoans = overdueLoansList.length;

  // 2. Category distribution aggregation
  const categories = await Book.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const categoryData = categories.map(cat => ({
    name: cat._id,
    value: cat.count
  }));

  // 3. Daily activity trends (Group by formatted issueDate string)
  const trends = await Transaction.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$issueDate' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  const trendData = trends.map(t => {
    const d = new Date(t._id);
    const label = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC' // maintain timezone neutrality
    });

    return {
      date: label,
      borrows: t.count
    };
  });

  return sendResponse(res, 200, 'Stats fetched successfully', {
    totalBooks,
    activeLoans,
    overdueLoans,
    totalMembers,
    categoryData,
    trendData,
    overdueLoansList
  });
});
