// modual
 

// External modual
const express = require("express");
const storeRouters = express.Router();

const multer = require('multer');
const path = require('path');
const isAuth = require('../middleware/is-auth');

const gethome = require('../Controllers/storeControllers')

storeRouters.get('/', gethome.gethome)
storeRouters.get('/homelist', gethome.homelist)
storeRouters.get('/home/:homeId', gethome.homeDeatail)
storeRouters.get('/rules/:homeId', gethome.getHomeRules);

// Protected Routes
storeRouters.get('/favourite', isAuth, gethome.getFavourite)
storeRouters.post('/favourite', isAuth, gethome.postaddtoFavourite)
storeRouters.post('/favourite/delete/:homeId', isAuth, gethome.postremoveFavourite);

storeRouters.get('/booking', isAuth, gethome.booking)
storeRouters.post('/booking', isAuth, gethome.postbooking)
storeRouters.post('/booking/delete/:homeId', isAuth, gethome.postremovebooking)

// New routes for intermediate booking details form
storeRouters.get('/booking/details/:homeId', isAuth, gethome.getBookingDetails)
storeRouters.post('/booking/details', isAuth, gethome.postBookingDetails)

// Update payment route to use reservationId
storeRouters.get('/payment/:reservationId', isAuth, gethome.getPayment)

// New route for invoice view
storeRouters.get('/booking/invoice/:reservationId', isAuth, gethome.viewInvoice);

// profile page
storeRouters.get('/profile', isAuth, gethome.profile);

module.exports = storeRouters