const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    index: true,
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true,
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies count is required'],
    min: [0, 'Available copies cannot be negative'],
    validate: {
      validator: function (value) {
        return value <= this.quantity;
      },
      message: 'Available copies ({VALUE}) cannot exceed total quantity ({PATH})',
    },
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'reserved'],
    default: 'available',
    index: true,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Compound search index for global searches
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
