const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  nights: { type: Number, required: true },
  guests: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  pricePerGuest: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  taxes: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  invoiceId: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Billing', billingSchema);
