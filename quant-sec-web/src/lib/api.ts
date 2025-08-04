// API client for communicating with the Django backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/quantserver';

export interface User {
  name: string;
  username: string;
  publicKey: string;
}

export interface Email {
  sender: string;
  sender_email?: string;
  sender_name?: string;
  receiver: string;
  datetime_of_arrival: string;
  encrypted_subject: string;
  encrypted_body: string;
}

export interface ApiResponse<T = any> {
  Message: string;
  Status: 'Positive' | 'Negative';
  [key: string]: any;
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Check if username is unique
  static async checkUsernameUniqueness(username: string): Promise<boolean> {
    const response = await this.request(`check-uniqueness?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
    
    // If Status is "Positive", the user doesn't exist (username is unique)
    return response.Status === 'Positive';
  }

  // Register a new user
  static async registerUser(
    name: string,
    email: string,
    username: string,
    publicKey: string,
    privateKey: string,
    password: string
  ): Promise<boolean> {
    const response = await this.request('register-user', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        username,
        public_key: publicKey,
        private_key: privateKey,
        password,
      }),
    });

    return response.Status === 'Positive';
  }

  // Get user's public key
  static async getUserPublicKey(username: string): Promise<{ name: string; publicKey: string } | null> {
    const response = await this.request(`get-public-key?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });

    if (response.Status === 'Positive') {
      return {
        name: response.Name,
        publicKey: response['Public Key'],
      };
    }

    return null;
  }

  // Login with email or username
  static async loginUser(identifier: string, password: string): Promise<ApiResponse> {
    return this.request('login-user', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  // Send an email (receiver/sender can be email or username)
  static async sendEmail(
    receiverIdentifier: string,
    senderIdentifier: string,
    encryptedSubject: string,
    encryptedBody: string,
    password: string
  ): Promise<boolean> {
    const response = await this.request('post-email', {
      method: 'POST',
      body: JSON.stringify({
        reciever_username: receiverIdentifier,
        sender_username: senderIdentifier,
        subject: encryptedSubject,
        body: encryptedBody,
        password,
      }),
    });
    return response.Status === 'Positive';
  }

  // Get user's inbox (identifier can be email or username)
  static async getInbox(identifier: string, password: string): Promise<Email[]> {
    const response = await this.request(`get-inbox?username=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`, {
      method: 'GET',
    });
    if (response.Status === 'Positive') {
      return response.Emails || [];
    }
    return [];
  }

  // Clear user's inbox (identifier can be email or username)
  static async clearInbox(identifier: string, password: string): Promise<boolean> {
    const response = await this.request('clear-inbox', {
      method: 'POST',
      body: JSON.stringify({
        username: identifier,
        password,
      }),
    });
    return response.Status === 'Positive';
  }
}

// Local storage utilities for user data
export interface UserData {
  name: string;
  email: string;
  username: string;
  publicKey: string;
  privateKey: string;
  password: string;
}

export class UserStorage {
  private static readonly STORAGE_KEY = 'quantsec_user_data';

  // Store user data securely
  static storeUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  // Retrieve user data
  static getUserData(): UserData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  // Check if user is logged in
  static isLoggedIn(): boolean {
    return this.getUserData() !== null;
  }

  // Get current user
  static getCurrentUser(): UserData | null {
    return this.getUserData();
  }

  // Clear user data (logout)
  static clearUserData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Update user data (e.g., after key import/export)
  static updateUserData(updates: Partial<UserData>): void {
    const currentData = this.getUserData();
    if (currentData) {
      const updatedData = { ...currentData, ...updates };
      this.storeUserData(updatedData);
    }
  }
} 