const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  homeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
  billingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing' },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  members: { type: Number, required: true },
  status: { type: String, default: 'Pending Payment' }
});

module.exports = mongoose.model('Reservation', reservationSchema);
