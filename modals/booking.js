const mongoose = require('mongoose');
 
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
   home: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home'
    ,require :true 
    }],
   billing: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing' },
   totalPrice: { type: Number },
   status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});

module.exports = mongoose.model('Booking', bookingSchema);
