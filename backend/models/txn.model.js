const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member reference is required'],
    index: true,
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued',
    index: true,
  },
  fineAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
