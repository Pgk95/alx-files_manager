const express = require('express');
// eslint-disable-next-line import/no-unresolved
const AppController = require('../controllers/AppController');
// eslint-disable-next-line import/no-unresolved
const UsersController = require('../controllers/UsersController');

const router = express.Router();

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);

module.exports = router;
