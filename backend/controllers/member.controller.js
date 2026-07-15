const { Member, Transaction, Reservation } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/response');

// Add Member
exports.addMember = catchAsync(async (req, res, next) => {
  const { name, email, phone, membershipId } = req.body;

  // Check if email already exists
  const existingEmail = await Member.findOne({ email });
  if (existingEmail) {
    return next(new AppError('A member with this email already exists.', 400));
  }

  // Check if membershipId already exists if provided
  if (membershipId) {
    const existingMemberId = await Member.findOne({ membershipId });
    if (existingMemberId) {
      return next(new AppError('A member with this membership ID already exists.', 400));
    }
  }

  const member = await Member.create({
    name,
    email,
    phone,
    membershipId: membershipId || undefined
  });

  return sendResponse(res, 211, 'Member registered successfully', member);
});

// Get All Members
exports.getAllMembers = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const whereClause = {};

  if (search) {
    whereClause.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { membershipId: { $regex: search, $options: 'i' } }
    ];
  }

  const members = await Member.find(whereClause).sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Members fetched successfully', members);
});

// Get Member By ID (including loans and reservations history)
exports.getMemberById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError(`Member with ID ${id} not found`, 404));
  }

  const transactions = await Transaction.find({ memberId: id })
    .sort({ createdAt: -1 })
    .populate('bookId', 'title author isbn');

  const reservations = await Reservation.find({ memberId: id })
    .sort({ createdAt: -1 })
    .populate('bookId', 'title author');

  const memberData = member.toJSON();
  memberData.transactions = transactions;
  memberData.reservations = reservations;

  return sendResponse(res, 200, 'Member fetched successfully', memberData);
});

// Update Member
exports.updateMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError(`Member with ID ${id} not found`, 404));
  }

  // Verify email uniqueness if updated
  if (email && email !== member.email) {
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return next(new AppError('A member with this email already exists.', 400));
    }
  }

  member.name = name !== undefined ? name : member.name;
  member.email = email !== undefined ? email : member.email;
  member.phone = phone !== undefined ? phone : member.phone;

  await member.save();

  return sendResponse(res, 200, 'Member updated successfully', member);
});

// Delete Member
exports.deleteMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError(`Member with ID ${id} not found`, 404));
  }

  // Check if member has active loans (unreturned borrow transactions)
  const activeLoansCount = await Transaction.countDocuments({
    memberId: id,
    returnDate: null
  });

  if (activeLoansCount > 0) {
    return next(new AppError(`Cannot delete member: Member has ${activeLoansCount} active checkouts that must be returned first.`, 400));
  }

  await Member.findByIdAndDelete(id);
  return sendResponse(res, 200, `Member ${id} deleted successfully`);
});
