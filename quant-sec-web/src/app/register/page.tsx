'use client';
import { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { RealKyber } from '@/lib/crypto';
import { ApiClient, UserStorage, UserData } from '@/lib/api';

const steps = ['Enter Details', 'Generate Keys', 'Register Account'];

export default function RegisterPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Add new state for key generation
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [keyGenLoading, setKeyGenLoading] = useState(false);
  const [keyGenError, setKeyGenError] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    
    return isValid;
  };

  // When entering step 1 (Generate Keys), trigger key generation
  useEffect(() => {
    if (activeStep === 1 && !keyPair && !keyGenLoading) {
      setKeyGenLoading(true);
      setKeyGenError(null);
      RealKyber.keygen()
        .then((kp) => {
          setKeyPair(kp);
          setKeyGenLoading(false);
        })
        .catch((err) => {
          setKeyGenError('Key generation failed. Please try again.');
          setKeyGenLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!validateStep1()) {
        return;
      }
      
      // Check username uniqueness
      setLoading(true);
      setError(null);
      try {
        const isUnique = await ApiClient.checkUsernameUniqueness(username);
        if (!isUnique) {
          setUsernameError('Username already exists');
          setLoading(false);
          return;
        }
        setActiveStep(1);
      } catch (err) {
        setError('Failed to check username. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Only allow next if keyPair is present and not loading
      if (!keyPair || keyGenLoading) return;
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!keyPair) {
        setError('Key pair not generated.');
        setLoading(false);
        return;
      }
      // Register user with backend
      const success = await ApiClient.registerUser(
        name,
        email,
        username,
        keyPair.publicKey,
        keyPair.privateKey, // send private key too
        password
      );
      
      if (success) {
        // Store user data locally
        const userData: UserData = {
          name,
          email,
          username,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          password,
        };
        
        UserStorage.storeUserData(userData);
        
        // Redirect to home page
        router.push('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!usernameError}
              helperText={usernameError}
              margin="normal"
              disabled={loading}
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
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              margin="normal"
              disabled={loading}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Generating Quantum-Safe Key Pair
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This process generates a Crystal-Kyber key pair for secure communication.<br />
              The private key will be stored securely in your browser.
            </Typography>
            {keyGenLoading && <CircularProgress />}
            {keyGenError && (
              <Alert severity="error" sx={{ mt: 2 }}>{keyGenError}</Alert>
            )}
            {keyPair && !keyGenLoading && !keyGenError && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Quantum key generated successfully!<br />
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                  Public Key: {keyPair.publicKey}
                </Typography>
              </Alert>
            )}
            {keyGenError && (
              <Button sx={{ mt: 2 }} onClick={() => {
                setKeyGenLoading(true);
                setKeyGenError(null);
                RealKyber.keygen()
                  .then((kp) => {
                    setKeyPair(kp);
                    setKeyGenLoading(false);
                  })
                  .catch((err) => {
                    setKeyGenError('Key generation failed. Please try again.');
                    setKeyGenLoading(false);
                  });
              }} disabled={keyGenLoading}>
                Retry
              </Button>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Ready to Register
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your account will be created with the following details:
            </Typography>
            <Paper sx={{ p: 2, mb: 2, textAlign: 'left' }}>
              <Typography><strong>Name:</strong> {name}</Typography>
              <Typography><strong>Email:</strong> {email}</Typography>
              <Typography><strong>Username:</strong> {username}</Typography>
              <Typography><strong>Key Pair:</strong> {keyPair ? 'Generated ✓' : 'Not generated'}</Typography>
            </Paper>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Join the Quantum Secure Email Network
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading || (activeStep === 1 && (!keyPair || keyGenLoading))}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Checking...' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 