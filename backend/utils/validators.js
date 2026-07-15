const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdMessage = 'must be a valid 24-character hexadecimal MongoDB ObjectId';

const bookSchemas = {
  create: Joi.object({
    title: Joi.string().required().messages({
      'any.required': 'Title is required',
      'string.empty': 'Title cannot be empty'
    }),
    author: Joi.string().required().messages({
      'any.required': 'Author is required',
      'string.empty': 'Author cannot be empty'
    }),
    isbn: Joi.string().required().messages({
      'any.required': 'ISBN is required',
      'string.empty': 'ISBN cannot be empty'
    }),
    category: Joi.string().required().messages({
      'any.required': 'Category is required',
      'string.empty': 'Category cannot be empty'
    }),
    quantity: Joi.number().integer().min(0).required().messages({
      'any.required': 'Quantity is required',
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative'
    }),
    availableCopies: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Available copies must be a number',
      'number.integer': 'Available copies must be an integer',
      'number.min': 'Available copies cannot be negative'
    })
  }),

  update: Joi.object({
    title: Joi.string().optional(),
    author: Joi.string().optional(),
    isbn: Joi.string().optional(),
    category: Joi.string().optional(),
    quantity: Joi.number().integer().min(0).optional(),
    availableCopies: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('available', 'borrowed', 'reserved').optional()
  })
};

const memberSchemas = {
  create: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty'
    }),
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Invalid email format'
    }),
    phone: Joi.string().regex(/^\+?[\d\s-()]{7,20}$/).required().messages({
      'any.required': 'Phone number is required',
      'string.empty': 'Phone number cannot be empty',
      'string.pattern.base': 'Phone number must be a valid format (7-20 digits, spaces, or hyphens)'
    }),
    membershipId: Joi.string().optional().allow('')
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().regex(/^\+?[\d\s-()]{7,20}$/).optional().messages({
      'string.pattern.base': 'Phone number must be a valid format (7-20 digits, spaces, or hyphens)'
    }),
    status: Joi.string().valid('active', 'inactive').optional()
  })
};

const txnSchemas = {
  borrow: Joi.object({
    bookId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Book ID is required',
      'string.pattern.base': `Book ID ${objectIdMessage}`
    }),
    memberId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Member ID is required',
      'string.pattern.base': `Member ID ${objectIdMessage}`
    }),
    dueDate: Joi.string().isoDate().required().messages({
      'any.required': 'Due date is required',
      'string.isoDate': 'Due date must be a valid ISO date (YYYY-MM-DD)'
    })
  }),

  returnBook: Joi.object({
    txnId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Transaction ID is required',
      'string.pattern.base': `Transaction ID ${objectIdMessage}`
    })
  })
};

const resSchemas = {
  reserve: Joi.object({
    bookId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Book ID is required',
      'string.pattern.base': `Book ID ${objectIdMessage}`
    }),
    memberId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Member ID is required',
      'string.pattern.base': `Member ID ${objectIdMessage}`
    })
  }),

  cancel: Joi.object({
    resId: Joi.string().regex(objectIdRegex).required().messages({
      'any.required': 'Reservation ID is required',
      'string.pattern.base': `Reservation ID ${objectIdMessage}`
    })
  })
};

const authSchemas = {
  register: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty'
    }),
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Invalid email format'
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters long'
    }),
    role: Joi.string().valid('admin', 'librarian').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Invalid email format'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty'
    })
  })
};

module.exports = {
  bookSchemas,
  memberSchemas,
  txnSchemas,
  resSchemas,
  authSchemas
};
