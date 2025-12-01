const express = require('express');
const authRoutes = express.Router();
 

const authControllers = require('../Controllers/authControllers');

authRoutes.get('/login', authControllers.getLogin );
authRoutes.post('/login', authControllers.postLogin);
authRoutes.post('/logout', authControllers.postLogout);
authRoutes.get('/singup', authControllers.getsingup);
authRoutes.post('/singup', authControllers.postsingup);
authRoutes.get('/forgot-password',authControllers.getForgotPassword);
authRoutes.post('/forgot-password',authControllers.postForgotPassword);
authRoutes.get('/reset-password/:token',authControllers.getResetPassword);
authRoutes.post('/reset-password/:token',authControllers.postResetPassword);
 
module.exports = authRoutes;