
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
const { Result } = require("postcss")
const { default: mongoose } = require("mongoose")
const multer = require('multer')
const bcrypt = require('bcryptjs');

const DB_path = process.env.MONGO_URI

const multerOption = require('./middleware/img-upload')


const app = express()
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
app.use(multer(multerOption).single('photo'))
app.use(express.static(path.join(rootDir, 'public')))
app.use("/uploads",express.static(path.join(rootDir,'uploads')))
app.use("/host/uploads",express.static(path.join(rootDir,'uploads')))
app.use("/home/uploads",express.static(path.join(rootDir,'uploads')))




// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));


// Session configuration with hardcoded secret (for development only)
app.use(session({
  secret: 'your-secret-key-here-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

app.use(session({
  secret: 'bhautik',
  resave: false,
  saveUninitialized: true,
  store: store,
}))

 

app.use((req, res, next) => {
  // console.log("cookie chek midderwere",req.get('Cookie'))
  req.isLoggedIn = req.session.isLoggedIn
  next();
})




app.use(authRoutes)
app.use(storeRouters)
app.use('/host', (req, res, next) => {
  if (req.isLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
});
app.use('/host', hostRoutes)




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

const port = process.env.PORT || 3000;

mongoose.connect(DB_path).then(() => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`)
  })
}).catch((err) => {
  console.log("Error connecting to MongoDB", err);
})

 
