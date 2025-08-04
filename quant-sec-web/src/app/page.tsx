'use client';
import { Box, Button, Container, Typography, Stack } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    setIsLoggedIn(typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          Quantum Secure Email
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Post-Quantum Encrypted Messaging with Crystal-Kyber, AES-256, and HMAC
        </Typography>
      </Box>
      <Stack spacing={2}>
        {!isLoggedIn ? (
          <>
            <Button component={Link} href="/register" variant="contained" size="large" color="primary" fullWidth>
              Register
            </Button>
            <Button component={Link} href="/login" variant="outlined" size="large" color="primary" fullWidth>
              Login
            </Button>
          </>
        ) : (
          <>
            <Button component={Link} href="/inbox" variant="contained" size="large" color="secondary" fullWidth>
              Inbox
            </Button>
            <Button component={Link} href="/compose" variant="outlined" size="large" color="secondary" fullWidth>
              Compose Email
            </Button>
            <Button component={Link} href="/keys" variant="text" size="large" color="inherit" fullWidth>
              Key Management
            </Button>
            <Button component={Link} href="/test" variant="text" size="large" color="secondary" fullWidth>
              Test Crypto
            </Button>
            <Button onClick={handleLogout} variant="contained" size="large" color="error" fullWidth>
              Logout
            </Button>
          </>
        )}
      </Stack>
    </Container>
  );
}
