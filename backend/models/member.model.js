const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  membershipId: {
    type: String,
    required: [true, 'Membership ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Pre-validate hook to generate membershipId if not provided
memberSchema.pre('validate', function () {
  if (!this.membershipId) {
    const timestamp = Date.now().toString().slice(-2);
    const random = Math.floor(10 + Math.random() * 90);
    this.membershipId = `MEM-${timestamp}${random}`;
  }
});

// Text index for searches
memberSchema.index({ name: 'text', email: 'text', membershipId: 'text' });

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
