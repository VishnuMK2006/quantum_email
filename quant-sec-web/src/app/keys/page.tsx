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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import { ContentCopy, Visibility, VisibilityOff, Download, Upload } from '@mui/icons-material';
import { UserStorage, UserData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function KeysPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const data = UserStorage.getUserData();
    if (!data) {
      router.push('/login');
      return;
    }
    setUserData(data);
  }, [router]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleExportKeys = () => {
    if (!userData) return;
    
    const exportData = {
      name: userData.name,
      username: userData.username,
      publicKey: userData.publicKey,
      privateKey: userData.privateKey,
      password: userData.password,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantsec-keys-${userData.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportKeys = () => {
    setImportError(null);
    
    try {
      const parsedData = JSON.parse(importData);
      
      // Validate the imported data
      const requiredFields = ['name', 'username', 'publicKey', 'privateKey', 'password'];
      for (const field of requiredFields) {
        if (!parsedData[field]) {
          setImportError(`Missing required field: ${field}`);
          return;
        }
      }
      
      // Update user data
      UserStorage.storeUserData(parsedData);
      setUserData(parsedData);
      setImportDialogOpen(false);
      setImportData('');
      
    } catch (err) {
      setImportError('Invalid JSON format');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
            Key Management
          </Typography>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Your private key is stored securely in your browser's local storage. 
            Never share your private key with anyone. Export your keys to backup your account.
          </Typography>
        </Alert>

        {/* User Info */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`Name: ${userData.name}`} variant="outlined" />
            <Chip label={`Username: ${userData.username}`} variant="outlined" />
          </Box>
        </Paper>

        {/* Public Key */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Public Key
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this key with others so they can send you encrypted messages.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={userData.publicKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleCopy(userData.publicKey, 'public')}
                    edge="end"
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
          {copiedField === 'public' && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
              Public key copied to clipboard!
            </Typography>
          )}
        </Paper>

        {/* Private Key */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Private Key
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Keep this secret!</strong> This key is used to decrypt messages sent to you.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            type={showPrivateKey ? 'text' : 'password'}
            value={userData.privateKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    edge="end"
                  >
                    {showPrivateKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  <IconButton
                    onClick={() => handleCopy(userData.privateKey, 'private')}
                    edge="end"
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
          {copiedField === 'private' && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
              Private key copied to clipboard!
            </Typography>
          )}
        </Paper>

        {/* Password */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This password is used for authentication with the server.
          </Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={userData.password}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  <IconButton
                    onClick={() => handleCopy(userData.password, 'password')}
                    edge="end"
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
          {copiedField === 'password' && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
              Password copied to clipboard!
            </Typography>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportKeys}
          >
            Export Keys
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import Keys
          </Button>
        </Box>
      </Paper>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Keys</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste the exported JSON data to restore your account.
          </Typography>
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={8}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste your exported JSON data here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImportKeys}
            variant="contained"
            disabled={!importData.trim()}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 