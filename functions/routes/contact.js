const express = require('express');
const router = express.Router();
const { postFeedback } = require('../controllers/contactController');

router.post('/', postFeedback);

module.exports = router;