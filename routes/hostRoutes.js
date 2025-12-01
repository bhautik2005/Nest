const express = require("express")
const hostRoutes = express.Router();
const path = require('path');
const hostControllers = require('../Controllers/hostControllers')
 



hostRoutes.get('/add-home',hostControllers.addhome)
 

hostRoutes.post('/add-home',hostControllers.postaddhome)
 
hostRoutes.get('/host-home',hostControllers.hosthome)

hostRoutes.get('/edit-home/:homeId',hostControllers.getEditHome)
hostRoutes.post('/edit-home',hostControllers.postEditHome)

hostRoutes.post('/delete-home/:homeId',hostControllers.postDeleteHome) 






exports.hostRoutes= hostRoutes
// module.hostRoutes = hostRoutes 
