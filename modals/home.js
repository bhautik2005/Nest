// const mongoose = require("mongoose");

// const homeSchema = mongoose.Schema({
//   houseName: { type: String, required: true },
//   price: { type: Number, required: true },
//   location: { type: String, required: true },
//   photo: String,
//   description: String,
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // New field
// });

// module.exports = mongoose.model("Home", homeSchema);

//--new code--
const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  photo: String, // optional
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // optional
});

module.exports = mongoose.model("Home", homeSchema);
