const User = require('../models/User');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Configure nodemailer (in production, use environment variables)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email employeeId department position hourlyRate totalHours').sort({ name: 1 });
    const total = users.length;
    res.json({ total, users });
  } catch (err) {
    console.error('adminController.getUsers error:', err && err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-passwordHash -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // compute salary example: salary = totalHours * hourlyRate + bonus
    const baseSalary = +( (user.totalHours || 0) * (user.hourlyRate || 0) ).toFixed(2);
    const bonus = user.bonus || 0;
    const totalSalary = +(baseSalary + bonus).toFixed(2);

    res.json({
      user,
      computed: {
        salary: totalSalary,
        baseSalary,
        bonus,
        totalHours: user.totalHours || 0,
        hourlyRate: user.hourlyRate || 0,
      },
    });
  } catch (err) {
    console.error('adminController.getUserDetails error:', err && err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.generatePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-passwordHash -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate pay based on working hours
    const regularHours = user.totalHours || 0;
    const hourlyRate = user.hourlyRate || 25;
    const grossPay = regularHours * hourlyRate;

    // Calculate deductions (example: 10% tax, 5% insurance)
    const taxDeduction = grossPay * 0.1;
    const insuranceDeduction = grossPay * 0.05;
    const totalDeductions = taxDeduction + insuranceDeduction;
    const netPay = grossPay - totalDeductions;

    const payslip = {
      employeeId: user.employeeId,
      employeeName: user.name,
      department: user.department,
      position: user.position,
      payPeriod: new Date().toLocaleDateString(),
      regularHours,
      hourlyRate,
      grossPay: grossPay.toFixed(2),
      deductions: {
        tax: taxDeduction.toFixed(2),
        insurance: insuranceDeduction.toFixed(2),
        total: totalDeductions.toFixed(2)
      },
      netPay: netPay.toFixed(2)
    };

    res.json({ payslip });
  } catch (err) {
    console.error('adminController.generatePayslip error:', err && err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.sendPayslipEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-passwordHash -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate payslip data
    const regularHours = user.totalHours || 0;
    const hourlyRate = user.hourlyRate || 25;
    const grossPay = regularHours * hourlyRate;
    const taxDeduction = grossPay * 0.1;
    const insuranceDeduction = grossPay * 0.05;
    const totalDeductions = taxDeduction + insuranceDeduction;
    const netPay = grossPay - totalDeductions;

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: `Payslip for ${new Date().toLocaleDateString()} - ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Payroll Slip</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Employee Information</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Employee ID:</strong> ${user.employeeId || 'N/A'}</p>
            <p><strong>Department:</strong> ${user.department || 'N/A'}</p>
            <p><strong>Position:</strong> ${user.position || 'N/A'}</p>
            <p><strong>Pay Period:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Earnings</h3>
            <p><strong>Regular Hours:</strong> ${regularHours} hrs</p>
            <p><strong>Hourly Rate:</strong> $${hourlyRate.toFixed(2)}</p>
            <p><strong>Gross Pay:</strong> $${grossPay.toFixed(2)}</p>
          </div>

          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Deductions</h3>
            <p><strong>Tax (10%):</strong> $${taxDeduction.toFixed(2)}</p>
            <p><strong>Insurance (5%):</strong> $${insuranceDeduction.toFixed(2)}</p>
            <p><strong>Total Deductions:</strong> $${totalDeductions.toFixed(2)}</p>
          </div>

          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0;"><strong>Net Pay: $${netPay.toFixed(2)}</strong></h3>
          </div>

          <p style="color: #666; font-size: 12px; text-align: center;">
            This is an automated payslip. Please contact HR if you have any questions.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Payslip sent successfully to employee email' });
  } catch (err) {
    console.error('adminController.sendPayslipEmail error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to send payslip email' });
  }
};

exports.sendAllPayslips = async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash -__v');
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        // Generate payslip data for each user
        const regularHours = user.totalHours || 0;
        const hourlyRate = user.hourlyRate || 25;
        const grossPay = regularHours * hourlyRate;
        const taxDeduction = grossPay * 0.1;
        const insuranceDeduction = grossPay * 0.05;
        const totalDeductions = taxDeduction + insuranceDeduction;
        const netPay = grossPay - totalDeductions;

        // Create email content
        const mailOptions = {
          from: process.env.EMAIL_USER || 'your-email@gmail.com',
          to: user.email,
          subject: `Payslip for ${new Date().toLocaleDateString()} - ${user.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; text-align: center;">Payroll Slip</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Employee Information</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Employee ID:</strong> ${user.employeeId || 'N/A'}</p>
                <p><strong>Department:</strong> ${user.department || 'N/A'}</p>
                <p><strong>Position:</strong> ${user.position || 'N/A'}</p>
                <p><strong>Pay Period:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Earnings</h3>
                <p><strong>Regular Hours:</strong> ${regularHours} hrs</p>
                <p><strong>Hourly Rate:</strong> $${hourlyRate.toFixed(2)}</p>
                <p><strong>Gross Pay:</strong> $${grossPay.toFixed(2)}</p>
              </div>

              <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Deductions</h3>
                <p><strong>Tax (10%):</strong> $${taxDeduction.toFixed(2)}</p>
                <p><strong>Insurance (5%):</strong> $${insuranceDeduction.toFixed(2)}</p>
                <p><strong>Total Deductions:</strong> $${totalDeductions.toFixed(2)}</p>
              </div>

              <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0;"><strong>Net Pay: $${netPay.toFixed(2)}</strong></h3>
              </div>

              <p style="color: #666; font-size: 12px; text-align: center;">
                This is an automated payslip. Please contact HR if you have any questions.
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        results.push({ user: user.name, email: user.email, status: 'success' });
        successCount++;
      } catch (emailErr) {
        console.error(`Failed to send payslip to ${user.email}:`, emailErr.message);
        results.push({ user: user.name, email: user.email, status: 'failed', error: emailErr.message });
        failureCount++;
      }
    }

    res.json({
      message: `Bulk payslip sending completed. ${successCount} successful, ${failureCount} failed.`,
      results,
      summary: { total: users.length, success: successCount, failed: failureCount }
    });
  } catch (err) {
    console.error('adminController.sendAllPayslips error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to send bulk payslips' });
  }
};

exports.downloadAllPayslips = async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash -__v').sort({ name: 1 });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslips-${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Employee Payslips Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    let pageCount = 0;

    for (const user of users) {
      if (pageCount > 0) {
        doc.addPage();
      }
      pageCount++;

      // Calculate pay data
      const regularHours = user.totalHours || 0;
      const hourlyRate = user.hourlyRate || 25;
      const grossPay = regularHours * hourlyRate;
      const bonus = user.bonus || 0;
      const totalEarnings = grossPay + bonus;
      const taxDeduction = totalEarnings * 0.1;
      const insuranceDeduction = totalEarnings * 0.05;
      const totalDeductions = taxDeduction + insuranceDeduction;
      const netPay = totalEarnings - totalDeductions;

      // Employee header
      doc.fontSize(16).text('PAYROLL SLIP', { align: 'center', underline: true });
      doc.moveDown();

      // Employee information
      doc.fontSize(12);
      doc.text(`Employee Name: ${user.name}`);
      doc.text(`Employee ID: ${user.employeeId || 'N/A'}`);
      doc.text(`Department: ${user.department || 'N/A'}`);
      doc.text(`Position: ${user.position || 'N/A'}`);
      doc.text(`Pay Period: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Earnings section
      doc.fontSize(14).text('EARNINGS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Regular Hours: ${regularHours} hrs`);
      doc.text(`Hourly Rate: $${hourlyRate.toFixed(2)}`);
      doc.text(`Gross Pay: $${grossPay.toFixed(2)}`);
      if (bonus > 0) {
        doc.text(`Bonus: $${bonus.toFixed(2)}`);
      }
      doc.text(`Total Earnings: $${totalEarnings.toFixed(2)}`);
      doc.moveDown();

      // Deductions section
      doc.fontSize(14).text('DEDUCTIONS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Tax (10%): $${taxDeduction.toFixed(2)}`);
      doc.text(`Insurance (5%): $${insuranceDeduction.toFixed(2)}`);
      doc.text(`Total Deductions: $${totalDeductions.toFixed(2)}`);
      doc.moveDown();

      // Net pay
      doc.fontSize(14).text('NET PAY', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(16).text(`$${netPay.toFixed(2)}`, { align: 'center' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text('This is an automated payslip. Please contact HR if you have any questions.', {
        align: 'center',
        color: 'gray'
      });
    }

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error('adminController.downloadAllPayslips error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to generate payslip PDF' });
  }
};

exports.addBonusToAll = async (req, res) => {
  try {
    const { bonusAmount } = req.body;

    if (!bonusAmount || isNaN(bonusAmount) || bonusAmount <= 0) {
      return res.status(400).json({ message: 'Invalid bonus amount. Must be a positive number.' });
    }

    const result = await User.updateMany(
      {},
      { $inc: { bonus: parseFloat(bonusAmount) } }
    );

    res.json({
      message: `Bonus of $${bonusAmount} added to ${result.modifiedCount} employees.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('adminController.addBonusToAll error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to add bonus to employees' });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { userId, leaveIndex } = req.params;
    const { approvedBy } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.leaves || !user.leaves[leaveIndex]) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (user.leaves[leaveIndex].status !== 'pending') {
      return res.status(400).json({ message: 'Leave is not pending approval' });
    }

    user.leaves[leaveIndex].status = 'approved';
    user.leaves[leaveIndex].approvedBy = approvedBy;
    user.leaves[leaveIndex].approvedAt = new Date();

    await user.save();

    res.json({
      message: 'Leave approved successfully',
      leave: user.leaves[leaveIndex]
    });
  } catch (err) {
    console.error('adminController.approveLeave error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to approve leave' });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const { userId, leaveIndex } = req.params;
    const { approvedBy } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.leaves || !user.leaves[leaveIndex]) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (user.leaves[leaveIndex].status !== 'pending') {
      return res.status(400).json({ message: 'Leave is not pending approval' });
    }

    user.leaves[leaveIndex].status = 'rejected';
    user.leaves[leaveIndex].approvedBy = approvedBy;
    user.leaves[leaveIndex].approvedAt = new Date();

    await user.save();

    res.json({
      message: 'Leave rejected successfully',
      leave: user.leaves[leaveIndex]
    });
  } catch (err) {
    console.error('adminController.rejectLeave error:', err && err.message);
    res.status(500).json({ message: err.message || 'Failed to reject leave' });
  }
};
