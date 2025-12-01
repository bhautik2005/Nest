const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log("✅ MongoDB Connected");
  process.exit(0);
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});
