import React, { useState } from 'react';
import { Container, Card, CardContent, TextField, Button, Typography, Alert, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/constants';

export default function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email || !message) {
      setError('Please fill name, email and message.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to send message');
      } else {
        setSuccess('Message sent. Thank you for your feedback.');
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      console.error(err);
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 6 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Contact Us</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send feedback or report an issue to the company.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Full name" fullWidth required value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Email address" fullWidth required type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Subject" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Message" fullWidth required multiline minRows={4} value={message} onChange={(e) => setMessage(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
