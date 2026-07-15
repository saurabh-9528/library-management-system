const { Book, Member, Reservation } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/response');

// Reserve Book
exports.reserveBook = catchAsync(async (req, res, next) => {
  const { bookId, memberId } = req.body;

  // 1. Fetch Book
  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError(`Book with ID ${bookId} not found`, 404));
  }

  if (book.quantity <= 0 || book.status === 'lost' || book.status === 'damaged') {
    return next(new AppError('Cannot reserve an unavailable book.', 400));
  }

  // 2. Fetch Member
  const member = await Member.findById(memberId);
  if (!member) {
    return next(new AppError(`Member with ID ${memberId} not found`, 404));
  }

  // 3. Check if member already has an active reservation for this book
  const existingRes = await Reservation.findOne({
    bookId,
    memberId,
    status: 'active'
  });

  if (existingRes) {
    return next(new AppError('Member already has an active reservation for this book.', 400));
  }

  // 4. Update book status to reserved if it is currently available
  if (book.status === 'available') {
    book.status = 'reserved';
    await book.save();
  }

  // 5. Create reservation
  const reservation = await Reservation.create({
    bookId,
    memberId,
    reservationDate: new Date(),
    status: 'active'
  });

  const completeRes = await Reservation.findById(reservation._id)
    .populate('bookId', 'title author status')
    .populate('memberId', 'name email membershipId');

  return sendResponse(res, 211, 'Book reserved successfully', completeRes);
});

// Cancel Reservation
exports.cancelReservation = catchAsync(async (req, res, next) => {
  const { resId } = req.body;

  // 1. Fetch Reservation
  const reservation = await Reservation.findById(resId);
  if (!reservation) {
    return next(new AppError(`Reservation with ID ${resId} not found`, 404));
  }

  if (reservation.status !== 'active') {
    return next(new AppError('Only active reservations can be cancelled.', 400));
  }

  // 2. Cancel reservation
  reservation.status = 'cancelled';
  await reservation.save();

  // 3. Revert book status if no other active reservations exist
  const book = await Book.findById(reservation.bookId);
  if (book && book.status === 'reserved') {
    const otherActiveRes = await Reservation.findOne({
      bookId: book._id,
      status: 'active'
    });

    if (!otherActiveRes) {
      book.status = book.availableCopies > 0 ? 'available' : 'borrowed';
      await book.save();
    }
  }

  const completeRes = await Reservation.findById(reservation._id)
    .populate('bookId', 'title author status')
    .populate('memberId', 'name email membershipId');

  return sendResponse(res, 200, 'Reservation cancelled successfully', completeRes);
});

// Get Reservations (with filtering)
exports.getReservations = catchAsync(async (req, res, next) => {
  const { bookId, memberId, status } = req.query;
  const whereClause = {};

  if (bookId) whereClause.bookId = bookId;
  if (memberId) whereClause.memberId = memberId;
  if (status) whereClause.status = status;

  const reservations = await Reservation.find(whereClause)
    .populate('bookId', 'title author')
    .populate('memberId', 'name email membershipId')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Reservations fetched successfully', reservations);
});
