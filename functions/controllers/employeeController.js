const User = require('../models/User');

exports.addLeave = async (req, res) => {
  try {
    const { date, policy, status } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets req.user

    // Map policy to type
    const typeMap = {
      'Medical Leave': 'medical',
      'Vacation Leave': 'vacation'
    };
    const type = typeMap[policy] || 'personal';

    // Map status to lowercase
    const leaveStatus = status ? status.toLowerCase() : 'pending';

    const newLeave = {
      type,
      days: 1, // Assuming single day for now
      startDate: date,
      endDate: date,
      status: leaveStatus,
      reason: `Requested via dashboard on ${new Date().toISOString().split('T')[0]}`
    };

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.leaves.push(newLeave);
    await user.save();

    res.json({ message: 'Leave request added successfully', leave: newLeave });
  } catch (err) {
    console.error('employeeController.addLeave error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
