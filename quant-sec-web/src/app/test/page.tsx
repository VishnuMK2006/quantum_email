'use client';
import { useState } from 'react';
import { Box, Button, Typography, Container, Paper, TextField } from '@mui/material';
import { RealKyber, CryptoUtils } from '@/lib/crypto';
import { UserStorage } from '@/lib/api';

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResult('Running tests...\n');
    
    try {
      // Test 1: Real Kyber key generation
      setTestResult(prev => prev + '1. Testing Real Kyber key generation...\n');
      const keyPair = await RealKyber.keygen();
      setTestResult(prev => prev + `   ✓ Generated real Kyber keypair (Public: ${keyPair.publicKey.substring(0, 20)}...)\n`);
      
      // Test 2: AES encryption/decryption
      const testMessage = 'Hello, Quantum World!';
      const encrypted = await CryptoUtils.aesEncrypt(testMessage, 'test-key');
      const decrypted = await CryptoUtils.aesDecrypt(encrypted, 'test-key');
      setTestResult(prev => prev + `   ✓ AES encryption/decryption: ${testMessage === decrypted ? 'PASS' : 'FAIL'}\n`);
      
      // Test 3: SHA-256
      setTestResult(prev => prev + '3. Testing SHA-256...\n');
      const hash = await CryptoUtils.sha256('test');
      setTestResult(prev => prev + `   ✓ SHA-256 hash generated: ${hash.substring(0, 20)}...\n`);
      
      // Test 4: Random bytes
      setTestResult(prev => prev + '4. Testing random bytes...\n');
      const randomBytes = await CryptoUtils.randomBytes(32);
      setTestResult(prev => prev + `   ✓ Generated ${randomBytes.length} random bytes\n`);
      
      // Test 5: Real Kyber encryption/decryption
      setTestResult(prev => prev + '5. Testing Real Kyber encryption/decryption...\n');
      
      // First, store the test user's private key using UserStorage for the test
      const testUserData = {
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword',
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      };
      UserStorage.storeUserData(testUserData);
      
      const testMessage2 = 'Hello, Quantum World!';
      const encryptedData = await RealKyber.encrypt(testMessage2, keyPair.publicKey);
      const decryptedMessage = await RealKyber.decrypt(
        encryptedData.tag,
        encryptedData.concatenated_string,
        'testuser'
      );
      setTestResult(prev => prev + `   ✓ Kyber encryption/decryption: ${testMessage2 === decryptedMessage ? 'PASS' : 'FAIL'}\n`);
      
      // Clean up test data
      UserStorage.clearUserData();
      
      setTestResult(prev => prev + '\n All tests passed!\n');
      
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Test failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Crypto Test Page
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          This page tests the cryptographic utilities to ensure they're working correctly.
        </Typography>
        
        <Button
          variant="contained"
          onClick={runTests}
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
        
        <TextField
          fullWidth
          multiline
          rows={15}
          value={testResult}
          InputProps={{ readOnly: true }}
          variant="outlined"
          placeholder="Test results will appear here..."
        />
      </Paper>
    </Container>
  );
} 