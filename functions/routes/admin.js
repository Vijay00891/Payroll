const express = require('express');
const router = express.Router();
const { getUsers, getUserDetails, generatePayslip, sendPayslipEmail, sendAllPayslips, downloadAllPayslips, addBonusToAll, approveLeave, rejectLeave } = require('../controllers/adminController');

// NOTE: For demo this route is not protected. Add auth middleware in production.
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/payslip', generatePayslip);
router.post('/users/:id/send-payslip', sendPayslipEmail);
router.post('/send-all-payslips', sendAllPayslips);
router.get('/download-all-payslips', downloadAllPayslips);
router.post('/add-bonus', addBonusToAll);
router.post('/users/:userId/leaves/:leaveIndex/approve', approveLeave);
router.post('/users/:userId/leaves/:leaveIndex/reject', rejectLeave);

module.exports = router;
