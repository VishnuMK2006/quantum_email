'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Container,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { UserStorage, ApiClient, Email } from '@/lib/api';
import { decrypt } from '@/lib/crypto';

interface DecryptedEmail {
  id: string;
  sender: string;
  sender_email?: string;
  sender_name?: string;
  subject: string;
  body: string;
  datetime: string;
  macVerified: boolean;
  macError?: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [emails, setEmails] = useState<DecryptedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<DecryptedEmail | null>(null);
  const [showBody, setShowBody] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const data = UserStorage.getUserData();
    if (!data) {
      router.push('/login');
      return;
    }
    setUserData(data);
    fetchEmails(data);
  }, [router]);

  const fetchEmails = async (user: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const encryptedEmails = await ApiClient.getInbox(user.username, user.password);
      const decryptedEmails: DecryptedEmail[] = [];
      
      for (const [index, email] of encryptedEmails.entries()) {
        try {
          // Parse the encrypted data
          const encryptedSubject = JSON.parse(email.encrypted_subject);
          const encryptedBody = JSON.parse(email.encrypted_body);
          
          // Decrypt subject and body using real Kyber
          const decryptedSubject = await decrypt(
            encryptedSubject.tag,
            encryptedSubject.concatenated_string,
            user.username
          );
          
          const decryptedBody = await decrypt(
            encryptedBody.tag,
            encryptedBody.concatenated_string,
            user.username
          );
          
          decryptedEmails.push({
            id: `${email.sender}-${email.datetime_of_arrival}-${index}`,
            sender: email.sender,
            sender_email: email.sender_email,
            sender_name: email.sender_name,
            subject: decryptedSubject,
            body: decryptedBody,
            datetime: email.datetime_of_arrival,
            macVerified: true
          });
          
        } catch (decryptError) {
          console.error('Decryption error for email:', email, 'Error:', decryptError);
          // If decryption fails, add email with error flag
          decryptedEmails.push({
            id: `error-${email.sender}-${email.datetime_of_arrival}-${index}`,
            sender: email.sender,
            sender_email: email.sender_email,
            sender_name: email.sender_name,
            subject: '[DECRYPTION FAILED]',
            body: `This message could not be decrypted. Error: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`,
            datetime: email.datetime_of_arrival,
            macVerified: false,
            macError: decryptError instanceof Error ? decryptError.message : 'Unknown error'
          });
        }
      }
      
      setEmails(decryptedEmails);
      
    } catch (err) {
      setError('Failed to fetch emails. Please try again.');
      console.error('Fetch emails error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (userData) {
      fetchEmails(userData);
    }
  };

  const handleClearInbox = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const success = await ApiClient.clearInbox(userData.username, userData.password);
      if (success) {
        setEmails([]);
      } else {
        setError('Failed to clear inbox.');
      }
    } catch (err) {
      setError('Failed to clear inbox.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmail = (email: DecryptedEmail) => {
    setSelectedEmail(email);
  };

  const toggleShowBody = (emailId: string) => {
    setShowBody(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
    } catch {
      return dateTimeStr;
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Inbox
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleClearInbox}
              disabled={loading}
            >
              Clear All
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && emails.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No messages in your inbox
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Messages will appear here once you receive encrypted emails from other users.
            </Typography>
          </Box>
        )}

        {!loading && emails.length > 0 && (
          <List>
            {emails.map((email, index) => (
              <Box key={email.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {email.sender.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Primary content */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" component="h3">
                        {email.subject}
                      </Typography>
                      {email.macVerified ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </Box>
                    
                    {/* Secondary content */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                        From: {email.sender_name ? `${email.sender_name} <${email.sender_email}>` : email.sender_email || email.sender}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                        {formatDateTime(email.datetime)}
                      </Typography>
                      {!email.macVerified && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            icon={<Warning />}
                            label="MAC Verification Failed"
                            color="error"
                            size="small"
                          />
                        </Box>
                      )}
                      {showBody[email.id] && (
                        <Typography variant="body2" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                          {email.body}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => toggleShowBody(email.id)}
                      size="small"
                    >
                      {showBody[email.id] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <Button
                      size="small"
                      onClick={() => handleViewEmail(email)}
                    >
                      View
                    </Button>
                  </Box>
                </ListItem>
                {index < emails.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Email Detail Dialog */}
      <Dialog
        open={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmail && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedEmail.subject}
                {selectedEmail.macVerified ? (
                  <CheckCircle color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                From: {selectedEmail.sender_name ? `${selectedEmail.sender_name} <${selectedEmail.sender_email}>` : selectedEmail.sender_email || selectedEmail.sender}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {formatDateTime(selectedEmail.datetime)}
              </Typography>
              {!selectedEmail.macVerified && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> This message failed MAC verification. 
                    It may have been tampered with or the sender's key has changed.
                  </Typography>
                  {selectedEmail.macError && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Error: {selectedEmail.macError}
                    </Typography>
                  )}
                </Alert>
              )}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedEmail.body}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEmail(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
} 