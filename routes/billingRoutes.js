const express = require("express");
const billingRouters = express.Router();
const billingController = require('../Controllers/billingController');

// Use centralized middleware
const isAuth = require('../middleware/is-auth');

billingRouters.post('/api/billing/calculate', billingController.calculatePrice);
billingRouters.post('/api/billing/create', isAuth, billingController.createBilling);
billingRouters.get('/api/billing/:id', isAuth, billingController.getBillingDetails);
billingRouters.get('/api/billing/:id/download', isAuth, billingController.downloadInvoice);

module.exports = billingRouters;
