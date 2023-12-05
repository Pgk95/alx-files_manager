const express = require('express');
// eslint-disable-next-line import/no-unresolved
const AppController = require('../controllers/AppController');
// eslint-disable-next-line import/no-unresolved
const UsersController = require('../controllers/UsersController');
// eslint-disable-next-line import/no-unresolved
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

module.exports = router;
