const { Book, Member, Transaction, Reservation } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/response');

// Issue Book (Borrow)
exports.borrowBook = catchAsync(async (req, res, next) => {
  const { bookId, memberId, dueDate } = req.body;

  // 1. Fetch Book and verify availability
  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError(`Book with ID ${bookId} not found`, 404));
  }

  if (book.availableCopies <= 0 || book.status === 'borrowed') {
    return next(new AppError('No copies available for borrowing.', 400));
  }

  // 1b. Prevent duplicate active issues of the same book to the same member
  const activeLoan = await Transaction.findOne({
    bookId,
    memberId,
    status: 'issued',
    returnDate: null
  });
  if (activeLoan) {
    return next(new AppError('Member already has an active loan for this book.', 400));
  }

  // 2. Fetch Member
  const member = await Member.findById(memberId);
  if (!member) {
    return next(new AppError(`Member with ID ${memberId} not found`, 404));
  }

  // 3. Handle active reservations queue
  const activeReservations = await Reservation.find({ bookId, status: 'active' })
    .sort({ reservationDate: 1 });

  if (activeReservations.length > 0) {
    const primaryReservation = activeReservations[0];
    
    // If the first reservation in the queue belongs to this member, complete it.
    if (primaryReservation.memberId.toString() === memberId.toString()) {
      primaryReservation.status = 'completed';
      await primaryReservation.save();
    } else {
      // Book is reserved for someone else first
      return next(new AppError(`This book is reserved by another member (${primaryReservation.memberId}) who is ahead in the queue.`, 400));
    }
  }

  // 4. Decrement available copies and update book status
  book.availableCopies -= 1;
  book.status = book.availableCopies === 0 ? 'borrowed' : book.status;
  await book.save();

  // 5. Create borrow transaction
  const txn = await Transaction.create({
    bookId,
    memberId,
    issueDate: new Date(),
    dueDate,
    status: 'issued',
    fineAmount: 0
  });

  const completeTxn = await Transaction.findById(txn._id)
    .populate('bookId', 'title author')
    .populate('memberId', 'name email membershipId');

  return sendResponse(res, 211, 'Book issued successfully', completeTxn);
});

// Return Book
exports.returnBook = catchAsync(async (req, res, next) => {
  const { txnId } = req.body;

  // 1. Fetch transaction
  const txn = await Transaction.findById(txnId);
  if (!txn) {
    return next(new AppError(`Transaction with ID ${txnId} not found`, 404));
  }

  if (txn.status !== 'issued' || txn.returnDate) {
    return next(new AppError('Cannot return a book that is not issued.', 400));
  }

  // 2. Fetch book
  const book = await Book.findById(txn.bookId);
  if (!book) {
    return next(new AppError(`Associated book not found`, 404));
  }

  // 3. Mark return date & calculate fine
  const today = new Date();
  const dueDate = new Date(txn.dueDate);
  let fine = 0;

  if (today > dueDate) {
    const diffTime = Math.abs(today - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fine = diffDays * 1.00; // $1.00 per day overdue
  }

  txn.returnDate = today;
  txn.status = 'returned';
  txn.fineAmount = fine;
  await txn.save();

  // 4. Increment available copies and update book status
  book.availableCopies += 1;
  
  // Check if there are active reservations for this book to determine status
  const hasActiveReservations = await Reservation.findOne({
    bookId: book._id,
    status: 'active'
  });

  book.status = hasActiveReservations ? 'reserved' : 'available';
  await book.save();

  const completeTxn = await Transaction.findById(txn._id)
    .populate('bookId', 'title author status')
    .populate('memberId', 'name email membershipId');

  return sendResponse(res, 200, 'Book returned successfully', completeTxn);
});

// Get Transaction History
exports.getTransactionHistory = catchAsync(async (req, res, next) => {
  const { bookId, memberId, status } = req.query;
  const whereClause = {};

  if (bookId) whereClause.bookId = bookId;
  if (memberId) whereClause.memberId = memberId;

  const today = new Date();

  if (status === 'active') {
    whereClause.status = 'issued';
    whereClause.returnDate = null;
  } else if (status === 'returned') {
    whereClause.status = 'returned';
  } else if (status === 'overdue') {
    whereClause.status = 'issued';
    whereClause.returnDate = null;
    whereClause.dueDate = { $lt: today };
  }

  const txns = await Transaction.find(whereClause)
    .populate('bookId', 'title author category')
    .populate('memberId', 'name email membershipId')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Transaction history fetched successfully', txns);
});
