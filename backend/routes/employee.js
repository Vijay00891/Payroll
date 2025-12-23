const express = require('express');
const router = express.Router();
const { addLeave } = require('../controllers/employeeController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Protected routes
router.post('/leave', auth, addLeave);

module.exports = router;
