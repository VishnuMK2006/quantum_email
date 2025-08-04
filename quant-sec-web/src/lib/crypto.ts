// Crypto utilities for the Quantum Secure Email Client
// Uses Web Crypto API for AES-256, HMAC-SHA256, and scrypt for key derivation
// Uses real Crystal-Kyber via backend API

import { UserStorage } from './api';

export interface KyberKeyPair {
  publicKey: string; // base64 encoded
  privateKey: string; // base64 encoded
}

export interface EncryptedData {
  tag: string; // HMAC-SHA256 hash
  concatenated_string: string; // JSON string with salt, cipher_text, encrypted_passkey, iv (snake_case to match backend)
}

export interface AESEncryptedData {
  cipher_text: string; // base64 encoded
  salt: string; // base64 encoded
  iv: string; // base64 encoded IV
}

// Web Crypto API utilities
export class CryptoUtils {
  // Generate random bytes
  static async randomBytes(length: number): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Convert ArrayBuffer or Uint8Array to base64
  static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convert base64 to ArrayBuffer
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Convert string to ArrayBuffer
  static stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    // Create a proper ArrayBuffer copy
    const buffer = new ArrayBuffer(uint8Array.byteLength);
    new Uint8Array(buffer).set(uint8Array);
    return buffer;
  }

  // Convert ArrayBuffer to string
  static arrayBufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  }

  // Derive key using scrypt (using scrypt-js library)
  static async deriveKey(password: string, salt: Uint8Array, keyLength: number = 32): Promise<Uint8Array> {
    // Import scrypt-js dynamically
    const { scrypt } = await import('scrypt-js');
    
    const passwordBuffer = this.stringToArrayBuffer(password);
    const derivedKey = await scrypt(
      new Uint8Array(passwordBuffer),
      salt,
      16384, // N = 2^14
      8,     // r = 8
      1,     // p = 1
      keyLength
    );
    
    return derivedKey;
  }

  // AES-256 encryption using Web Crypto API with secure IV
  static async aesEncrypt(plaintext: string, passkey: string): Promise<AESEncryptedData> {
    const salt = await this.randomBytes(16);
    const iv = await this.randomBytes(16); // ✅ Secure random IV
    const key = await this.deriveKey(passkey, salt);
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    // Pad the plaintext to 16-byte blocks
    const paddedText = this.pad(plaintext);
    const plaintextBuffer = this.stringToArrayBuffer(paddedText);
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      plaintextBuffer
    );

    return {
      cipher_text: this.arrayBufferToBase64(encryptedBuffer),
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv) // ✅ Include IV in output
    };
  }

  // AES-256 decryption using Web Crypto API with IV
  static async aesDecrypt(encryptedData: AESEncryptedData, passkey: string): Promise<string> {
    const salt = new Uint8Array(this.base64ToArrayBuffer(encryptedData.salt));
    const iv = new Uint8Array(this.base64ToArrayBuffer(encryptedData.iv)); // ✅ Use provided IV
    const key = await this.deriveKey(passkey, salt);
    
    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.cipher_text);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      encryptedBuffer
    );

    const decryptedText = this.arrayBufferToString(decryptedBuffer);
    return this.unpad(decryptedText);
  }

  // HMAC-SHA256 - ✅ Proper HMAC implementation
  static async hmacSha256(data: string, key: string): Promise<string> {
    const keyBuffer = this.stringToArrayBuffer(key);
    const dataBuffer = this.stringToArrayBuffer(data);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      dataBuffer
    );
    
    return this.arrayBufferToBase64(signature);
  }

  // SHA-256 hash
  static async sha256(data: string): Promise<string> {
    const dataBuffer = this.stringToArrayBuffer(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  // Pad string to 16-byte blocks
  private static pad(s: string): string {
    const blockSize = 16;
    const remainder = s.length % blockSize;
    const paddingNeeded = blockSize - remainder;
    return s + ' '.repeat(paddingNeeded);
  }

  // Unpad string
  private static unpad(s: string): string {
    return s.trim();
  }
}

// Real Kyber implementation via backend API
export class RealKyber {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/quantserver';

  // Generate real Kyber keypair via backend
  static async keygen(): Promise<KyberKeyPair> {
    const response = await fetch(`${this.API_BASE_URL}/kyber-keygen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate Kyber keypair');
    }

    const data = await response.json();
    if (data.Status === 'Positive') {
      return {
        publicKey: data.public_key,
        privateKey: data.private_key
      };
    } else {
      throw new Error(data.Message || 'Key generation failed');
    }
  }

  // Encrypt using real Kyber via backend
  static async encrypt(message: string, receiverPublicKey: string): Promise<EncryptedData> {
    console.log('Encrypt parameters:', { message, receiverPublicKey });

    const response = await fetch(`${this.API_BASE_URL}/kyber-encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        receiver_public_key: receiverPublicKey
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Encrypt response error:', response.status, errorText);
      throw new Error(`Failed to encrypt message: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Encrypt response data:', data);

    if (data.Status === 'Positive') {
      console.log('Encrypted data structure:', data.encrypted_data);
      return data.encrypted_data;
    } else {
      throw new Error(data.Message || 'Encryption failed');
    }
  }

  // Decrypt using real Kyber via backend
  static async decrypt(tag: string, concatenated_string: string, username: string): Promise<string> {
    // Get the user's private key from localStorage
    const userData = UserStorage.getUserData();
    if (!userData || !userData.privateKey) {
      throw new Error('User private key not found. Please log in again.');
    }

    console.log('Decrypt parameters:', { tag, concatenated_string, username, hasPrivateKey: !!userData.privateKey });

    const requestBody = {
      tag,
      concatenated_string: concatenated_string,
      username,
      private_key: userData.privateKey
    };

    console.log('Request body:', requestBody);

    const response = await fetch(`${this.API_BASE_URL}/kyber-decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', response.status, errorText);
      throw new Error(`Failed to decrypt message: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);

    if (data.Status === 'Positive') {
      return data.decrypted_message;
    } else {
      throw new Error(data.Message || 'Decryption failed');
    }
  }
}

// Main encryption function using real Kyber
export async function encrypt(message: string, receiverKyberPublicKey: string): Promise<EncryptedData> {
  return await RealKyber.encrypt(message, receiverKyberPublicKey);
}

// Main decryption function using real Kyber
export async function decrypt(
  tag: string, 
  concatenated_string: string, 
  username: string
): Promise<string> {
  return await RealKyber.decrypt(tag, concatenated_string, username);
} 