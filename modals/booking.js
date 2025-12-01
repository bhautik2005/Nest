const mongoose = require('mongoose');
 
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
   home: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home'
    ,require :true 
    }]
});

 


module.exports = mongoose.model('Booking', bookingSchema);
