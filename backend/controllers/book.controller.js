const { Book, Transaction, Reservation } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/response');

// Add Book
exports.addBook = catchAsync(async (req, res, next) => {
  const { title, author, isbn, category, quantity, availableCopies } = req.body;

  // Check if ISBN already exists
  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    return next(new AppError('A book with this ISBN already exists.', 400));
  }

  const copies = availableCopies !== undefined ? availableCopies : quantity;
  const status = copies > 0 ? 'available' : 'borrowed';

  const book = await Book.create({
    title,
    author,
    isbn,
    category,
    quantity,
    availableCopies: copies,
    status
  });

  return sendResponse(res, 211, 'Book added successfully', book);
});

// Get All Books (with search & filtering)
exports.getAllBooks = catchAsync(async (req, res, next) => {
  const { search, category, status } = req.query;
  const whereClause = {};

  if (category) {
    whereClause.category = category;
  }

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } }
    ];
  }

  const books = await Book.find(whereClause).sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Books fetched successfully', books);
});

// Get Book By ID (including recent transactions and reservations)
exports.getBookById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError(`Book with ID ${id} not found`, 404));
  }

  // Fetch recent loans and reservations
  const transactions = await Transaction.find({ bookId: id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('memberId', 'name email membershipId');

  const reservations = await Reservation.find({ bookId: id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('memberId', 'name email membershipId');

  const bookData = book.toJSON();
  bookData.transactions = transactions;
  bookData.reservations = reservations;

  return sendResponse(res, 200, 'Book fetched successfully', bookData);
});

// Update Book
exports.updateBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, author, isbn, category, quantity, availableCopies, status } = req.body;

  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError(`Book with ID ${id} not found`, 404));
  }

  // Verify ISBN uniqueness if updated
  if (isbn && isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return next(new AppError('A book with this ISBN already exists.', 400));
    }
  }

  // Adjust available copies if quantity changes
  let finalAvailableCopies = book.availableCopies;
  if (quantity !== undefined && quantity !== book.quantity) {
    const diff = quantity - book.quantity;
    finalAvailableCopies = book.availableCopies + diff;
    if (finalAvailableCopies < 0) {
      return next(new AppError('New quantity leaves negative available copies due to outstanding loans.', 400));
    }
  }

  if (availableCopies !== undefined) {
    finalAvailableCopies = availableCopies;
    if (finalAvailableCopies > (quantity !== undefined ? quantity : book.quantity)) {
      return next(new AppError('Available copies cannot exceed total quantity.', 400));
    }
  }

  // Determine final status based on updated copies if status is not explicitly set
  let finalStatus = status || book.status;
  if (!status && (quantity !== undefined || availableCopies !== undefined)) {
    finalStatus = finalAvailableCopies > 0 ? 'available' : 'borrowed';
  }

  book.title = title !== undefined ? title : book.title;
  book.author = author !== undefined ? author : book.author;
  book.isbn = isbn !== undefined ? isbn : book.isbn;
  book.category = category !== undefined ? category : book.category;
  book.quantity = quantity !== undefined ? quantity : book.quantity;
  book.availableCopies = finalAvailableCopies;
  book.status = finalStatus;

  await book.save();

  return sendResponse(res, 200, 'Book updated successfully', book);
});

// Delete Book
exports.deleteBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError(`Book with ID ${id} not found`, 404));
  }

  // Check if book has active checkouts
  if (book.availableCopies < book.quantity) {
    return next(new AppError('Cannot delete book: Some copies are currently borrowed.', 400));
  }

  const activeReservationsCount = await Reservation.countDocuments({
    bookId: id,
    status: 'active'
  });

  if (activeReservationsCount > 0) {
    return next(new AppError('Cannot delete book: Book has active reservations.', 400));
  }

  await Book.findByIdAndDelete(id);
  return sendResponse(res, 200, `Book ${id} deleted successfully`);
});
