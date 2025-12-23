import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container, Typography, Card, CardContent, TextField, Button, Box, Alert, Link as MuiLink, Grid,
} from '@mui/material';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin fixed credentials
    if (email === 'User@123' && password === 'Pass@123') {
      const adminUser = { id: 'admin-local', name: 'Admin', email, role: 'admin' };
      login(adminUser, 'admin-token');
      navigate('/dashboard', { replace: true });
      setLoading(false);
      return;
    }

    setError('Invalid admin credentials');
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
            Admin Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Admin only access
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              autoComplete="current-password"
            />

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mb: 2 }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={RouterLink} to="/login" variant="body2">
              Back to Employee Login
            </MuiLink>
          </Box>

          <Box sx={{ mt: 3, p: 2, borderRadius: 1, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Demo Admin Credentials:</Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Email: User@123
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Password: Pass@123
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}