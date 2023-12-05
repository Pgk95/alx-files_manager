const express = require('express');
// eslint-disable-next-line import/no-unresolved
const AppController = require('../controllers/AppController');

const router = express.Router();

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router;
