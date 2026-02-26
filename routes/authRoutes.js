const express = require('express');
const authRoutes = express.Router();
 

const authControllers = require('../Controllers/authControllers');

authRoutes.get('/login', authControllers.getLogin );
authRoutes.post('/login', authControllers.postLogin);
authRoutes.post('/logout', authControllers.postLogout);
// new correct signup routes
authRoutes.get('/signup', authControllers.getSignup);
authRoutes.post('/signup', authControllers.postSignup);

// legacy spelling redirection (clients may still request /singup)
authRoutes.get('/singup', (req, res) => res.redirect('/signup'));
authRoutes.post('/singup', (req, res) => res.redirect(307, '/signup'));
authRoutes.get('/forgot-password',authControllers.getForgotPassword);
authRoutes.post('/forgot-password',authControllers.postForgotPassword);
authRoutes.get('/reset-password/:token',authControllers.getResetPassword);
authRoutes.post('/reset-password/:token',authControllers.postResetPassword);
 
module.exports = authRoutes;