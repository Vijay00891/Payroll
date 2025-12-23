import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/constants';
import {
  Container, Typography, Card, CardContent, TextField, Button, Box, Alert, Link as MuiLink, Grid,
} from '@mui/material';

const Login = () => {
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
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
            Sign In
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Access your EMP Payroll account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email Address" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} autoComplete="email" />
            <TextField fullWidth label="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} autoComplete="current-password" />

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mb: 2 }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={RouterLink} to="/register" variant="body2">
              Don't have an account? Sign up
            </MuiLink>
          </Box>

          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              component={RouterLink} 
              to="/admin-login" 
              variant="outlined" 
              fullWidth 
              sx={{ mb: 2 }}
            >
              Admin Login
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, borderRadius: 1, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
              Demo User Credentials
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Email: admin@emppayroll.com
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Password: password
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
