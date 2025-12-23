const Feedback = require('../models/Feedback');

let nodemailer;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

const sendEmailIfConfigured = async ({ name, email, subject, message }) => {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const TO_EMAIL = process.env.TO_EMAIL || SMTP_USER;

  if (!nodemailer || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const html = `
    <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  await transporter.sendMail({
    from: `${name} <${SMTP_USER}>`,
    to: TO_EMAIL,
    subject: `Website feedback: ${subject || 'No subject'}`,
    html,
  });
};

exports.postFeedback = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });

    const fb = await Feedback.create({ name, email, subject, message });

    try {
      await sendEmailIfConfigured({ name, email, subject, message });
    } catch (e) {
      console.error('Failed to send feedback email:', e && e.message);
    }

    return res.status(201).json({ ok: true, feedbackId: fb._id });
  } catch (err) {
    console.error('contactController.postFeedback error:', err && err.message);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};