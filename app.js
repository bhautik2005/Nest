
//Extranal modual
const express = require("express")
const session = require('express-session')
const flash = require('express-flash');
const mongoDBStore = require('connect-mongodb-session')(session)
//core modual
const path = require('path')
require('dotenv').config();
//Locall modual
const storeRouters = require('./routes/storeRoutes')
const { hostRoutes } = require('./routes/hostRoutes')
const rootDir = require('./utilis/pathUtil')
const errorControllers = require('./Controllers/error')
const authRoutes = require('./routes/authRoutes')
const billingRouters = require('./routes/billingRoutes')
const isAuth = require('./middleware/is-auth');
const isHost = require('./middleware/is-host');
const setUser = require('./middleware/set-user');
const { Result } = require("postcss")
const { default: mongoose } = require("mongoose")
const multer = require('multer')
const bcrypt = require('bcryptjs');

const DB_path = process.env.MONGO_URI;

if (!DB_path) {
  console.error("❌ CRITICAL ERROR: MONGO_URI is not defined in environment variables!");
  console.error("Please create a .env file or set MONGO_URI in your deployment platform.");
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.warn("⚠️ WARNING: SESSION_SECRET is not defined. Using a default unsafe key.");
}

const multerOption = require('./middleware/img-upload');

const app = express();
// Trust proxy is required if deployed behind a reverse proxy (like Render, Heroku, Vercel, Nginx)
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('views', 'views')

const store = new mongoDBStore({
  uri: DB_path,
  collection: 'sessions'
});


app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded())
app.use(express.json());
app.use(multer(multerOption).any())
app.use(express.static(path.join(rootDir, 'public')))
app.use("/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/home/uploads", express.static(path.join(rootDir, 'uploads')))




// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

// Populate user and set locals
app.use(setUser);

// Routes
app.use(authRoutes)
app.use(storeRouters)
app.use(billingRouters)

// Protected host routes (Must be authenticated AND have host role)
app.use('/host', isAuth, isHost, hostRoutes)



app.use(errorControllers.error)
// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested could not be found.'
  });
});


app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});
const port = process.env.PORT || 3000
mongoose.connect(DB_path).then(() => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`)
  })
}).catch((err) => {
  console.log("Error connecting to MongoDB", err);
})


