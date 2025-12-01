const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    // Not required, assuming from your code
  },
  email: {
    type: String,
    required: true,
    unique: true // It's good practice to make email unique
  },
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['guest', 'host'] // Use enum for specific values
  },
   favourite : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Home' // or 'Product' or whatever you're favoriting
    }],
   // Password reset fields
  resetToken: {
    type: String,
    default: undefined
  },
  resetTokenExpiry: {
    type: Date,
    default: undefined
  },
  // Optional: Add more fields as needed
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ resetToken: 1 });
 

module.exports = mongoose.model('User', userSchema);
 
