// modual
 

//External modual
const express = require("express");
 const storeRouters =express.Router();


const multer = require('multer');
const path = require('path');
 


   
 const gethome = require('../Controllers/storeControllers')


storeRouters.get('/',gethome.gethome)
storeRouters.get('/homelist',gethome.homelist)
storeRouters.get('/favourite',gethome.getFavourite)

storeRouters.get('/booking',gethome.booking)
 
storeRouters.post('/booking',gethome.postbooking)
storeRouters.post('/booking/delete/:homeId',gethome.postremovebooking)
storeRouters.get('/home/:homeId',gethome.homeDeatail)

storeRouters.post('/favourite',gethome.postaddtoFavourite)
 
storeRouters.post('/favourite/delete/:homeId', gethome.postremoveFavourite);

storeRouters.get('/rules/:homeId', gethome.getHomeRules);

// profile page
storeRouters.get('/profile', gethome.profile);


module.exports = storeRouters