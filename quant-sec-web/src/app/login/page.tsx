'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Paper,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import { ApiClient, UserStorage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  
  // Validation
  const [loginInputError, setLoginInputError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setLoginInputError('');
    setPasswordError('');
    
    // Validate username
    if (!loginInput.trim()) {
      setLoginInputError('Email or Username is required');
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setLoginInputError('');
    
    try {
      const response = await ApiClient.loginUser(loginInput, password);
      if (response.Status === 'Positive') {
        // Build user data object for session
        const userData = {
          name: response.name,
          email: response.email,
          username: response.username,
          publicKey: response.public_key,
          privateKey: response.private_key || '',
          password: password,
        };
        UserStorage.storeUserData(userData);
        login(userData);
        router.replace('/dashboard');
      } else {
        setError(response.Message || 'User not found or password incorrect.');
      }
      
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Access your Quantum Secure Email Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email or Username"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            error={!!loginInputError}
            helperText={loginInputError}
            margin="normal"
            disabled={loading}
            onKeyDown={handleKeyDown}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            margin="normal"
            disabled={loading}
            onKeyDown={handleKeyDown}
          />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link href="/register" passHref>
              <MuiLink component="span" sx={{ cursor: 'pointer' }}>
                Register here
              </MuiLink>
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 