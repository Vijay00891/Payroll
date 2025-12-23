const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.TOKEN_EXPIRES_IN || '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, department, position } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing name, email or password' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, employeeId, department, position });

    const token = makeToken(user._id);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    // Detailed logging for debugging
    console.error('authController.register error:', err && err.message, err && err.stack);
    // Handle mongoose validation / duplicate errors more clearly
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error') });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = makeToken(user._id);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    console.error('authController.login error:', err && err.message, err && err.stack);
    return res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error') });
  }
};