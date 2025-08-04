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
  Paper,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Send, Person, CheckCircle, Error } from '@mui/icons-material';
import { UserStorage, ApiClient } from '@/lib/api';
import { encrypt } from '@/lib/crypto';

export default function ComposePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Validation
  const [recipientError, setRecipientError] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [messageError, setMessageError] = useState('');
  
  // Recipient validation
  const [recipientValidating, setRecipientValidating] = useState(false);
  const [recipientValid, setRecipientValid] = useState<boolean | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);

  useEffect(() => {
    const data = UserStorage.getUserData();
    if (!data) {
      router.push('/login');
      return;
    }
    setUserData(data);
  }, [router]);

  const validateRecipient = async (identifier: string) => {
    if (!identifier.trim()) {
      setRecipientError('Recipient email or username is required');
      setRecipientValid(null);
      return;
    }
    
    setRecipientValidating(true);
    setRecipientError('');
    
    try {
      const userInfo = await ApiClient.getUserPublicKey(identifier);
      if (userInfo) {
        setRecipientValid(true);
        setRecipientName(userInfo.name);
        setRecipientError('');
      } else {
        setRecipientValid(false);
        setRecipientError('User not found');
        setRecipientName(null);
      }
    } catch (err) {
      setRecipientValid(false);
      setRecipientError('Failed to validate recipient');
      setRecipientName(null);
    } finally {
      setRecipientValidating(false);
    }
  };

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setRecipientValid(null);
    setRecipientName(null);
    
    // Clear previous timeout
    if (window.recipientValidationTimeout) {
      clearTimeout(window.recipientValidationTimeout);
    }
    
    // Debounce validation
    window.recipientValidationTimeout = setTimeout(() => {
      if (value.trim()) {
        validateRecipient(value);
      }
    }, 500);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setRecipientError('');
    setSubjectError('');
    setMessageError('');
    
    // Validate recipient
    if (!recipient.trim()) {
      setRecipientError('Recipient email or username is required');
      isValid = false;
    } else if (recipientValid === false) {
      setRecipientError('Invalid recipient');
      isValid = false;
    }
    
    // Validate subject
    if (!subject.trim()) {
      setSubjectError('Subject is required');
      isValid = false;
    }
    
    // Validate message
    if (!message.trim()) {
      setMessageError('Message is required');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSend = async () => {
    if (!validateForm() || !userData) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get recipient's public key
      const recipientInfo = await ApiClient.getUserPublicKey(recipient);
      if (!recipientInfo) {
        setError('Recipient not found');
        return;
      }
      
      // Encrypt subject and message
      const encryptedSubject = await encrypt(subject, recipientInfo.publicKey);
      const encryptedBody = await encrypt(message, recipientInfo.publicKey);
      
      // Send the email
      const success = await ApiClient.sendEmail(
        recipient,
        userData.email || userData.username,
        JSON.stringify(encryptedSubject),
        JSON.stringify(encryptedBody),
        userData.password
      );
      
      if (success) {
        setSuccess(`Message sent successfully to ${recipientName || recipient}!`);
        // Clear form
        setRecipient('');
        setSubject('');
        setMessage('');
        setRecipientValid(null);
        setRecipientName(null);
      } else {
        setError('Failed to send message. Please try again.');
      }
      
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send email error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
  };

  if (!userData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Compose Email
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Send an encrypted message to another user
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {/* Recipient Field */}
          <TextField
            fullWidth
            label="To (Email or Username)"
            value={recipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            error={!!recipientError}
            helperText={recipientError}
            margin="normal"
            disabled={loading}
            InputProps={{
              endAdornment: recipientValidating ? (
                <CircularProgress size={20} />
              ) : recipientValid ? (
                <CheckCircle color="success" />
              ) : recipientValid === false ? (
                <Error color="error" />
              ) : null,
            }}
          />
          
          {recipientName && (
            <Chip
              icon={<Person />}
              label={recipientName}
              color="primary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}

          {/* Subject Field */}
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={!!subjectError}
            helperText={subjectError}
            margin="normal"
            disabled={loading}
          />

          {/* Message Field */}
          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={!!messageError}
            helperText={messageError}
            margin="normal"
            multiline
            rows={8}
            disabled={loading}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here... (Ctrl+Enter to send)"
          />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleSend}
            disabled={loading || recipientValid !== true}
            size="large"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => router.push('/')}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>

        {/* Security Info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            🔒 Message Security
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Your message will be encrypted using the recipient's public key
            • Only the recipient can decrypt and read the message
            • Message integrity is verified using HMAC-SHA256
            • The server cannot read your encrypted messages
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 