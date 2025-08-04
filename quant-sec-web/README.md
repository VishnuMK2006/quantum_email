# Quantum Secure Email Client - Web Frontend

A modern web-based frontend for the Quantum Secure Email Client, built with Next.js and Material-UI. This application provides a user-friendly interface for post-quantum encrypted email communication using Crystal-Kyber, AES-256, and HMAC-SHA256.

## 🚀 Features

### 🔐 Quantum-Safe Cryptography
- **Crystal-Kyber**: Post-quantum key exchange for secure communication
- **AES-256**: Symmetric encryption for message content
- **HMAC-SHA256**: Message authentication and integrity verification
- **scrypt**: Secure key derivation for password-based operations

### 📧 Email Functionality
- **User Registration**: Create accounts with automatic key pair generation
- **Secure Login**: Password-based authentication with local key storage
- **Compose Messages**: Encrypt and send emails to other users
- **Inbox Management**: Fetch, decrypt, and verify received messages
- **Key Management**: Export/import key pairs for backup and restoration

### 🎨 Modern UI/UX
- **Material-UI**: Clean, responsive design with modern components
- **Single Page Application**: Smooth navigation without page reloads
- **Progressive Web App**: Works offline and can be installed on devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **UI Library**: Material-UI (MUI)
- **Crypto**: Web Crypto API + scrypt-js
- **Storage**: Browser localStorage for user data
- **State Management**: React hooks and context

### Backend (Django)
- **Framework**: Django with Django REST Framework
- **Database**: SQLite (development) / MySQL (production)
- **CORS**: Configured for frontend-backend communication
- **API**: RESTful endpoints for all operations

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.7+ and pip
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd qsa
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Navigate to Django project
cd quant-sec-server/server

# Run database migrations
python manage.py migrate

# Start the Django server
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup
```bash
# Navigate to Next.js project
cd quant-sec-web

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 📱 Usage Guide

### 1. Registration
1. Navigate to the home page
2. Click "Register" to create a new account
3. Enter your name, username, and password
4. The system will generate a Kyber key pair automatically
5. Your account is created and you're logged in

### 2. Login
1. Click "Login" on the home page
2. Enter your username and password
3. Your stored keys will be loaded automatically

### 3. Key Management
1. Click "Key Management" to access your keys
2. View your public and private keys
3. Export keys for backup (recommended)
4. Import keys to restore your account on another device

### 4. Sending Messages
1. Click "Compose Email" from the home page
2. Enter the recipient's username
3. Add subject and message content
4. Click "Send" - the message is encrypted and sent

### 5. Receiving Messages
1. Click "Inbox" to fetch new messages
2. Messages are automatically decrypted and verified
3. View the decrypted content
4. MAC verification ensures message integrity

## 🔧 Development

### Project Structure
```
quant-sec-web/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── register/        # User registration
│   │   ├── login/          # User authentication
│   │   ├── keys/           # Key management
│   │   ├── compose/        # Message composition
│   │   ├── inbox/          # Message inbox
│   │   └── test/           # Crypto testing
│   ├── lib/                # Utility libraries
│   │   ├── crypto.ts       # Cryptographic functions
│   │   └── api.ts          # API client
│   └── components/         # Reusable components
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

### Key Files
- `src/lib/crypto.ts`: Cryptographic utilities (AES, HMAC, Kyber)
- `src/lib/api.ts`: API client for backend communication
- `src/app/register/page.tsx`: User registration with key generation
- `src/app/keys/page.tsx`: Key management and export/import

### Testing
Visit `/test` to run cryptographic tests and verify functionality.

## 🔒 Security Features

### Client-Side Security
- **Key Generation**: Kyber key pairs generated in-browser
- **Local Storage**: Private keys stored securely in localStorage
- **No Server Access**: Private keys never sent to the server
- **MAC Verification**: All messages verified for integrity

### Cryptographic Implementation
- **AES-256-CBC**: Message encryption with random IV
- **HMAC-SHA256**: Message authentication codes
- **scrypt**: Password-based key derivation (N=16384, r=8, p=1)
- **Crystal-Kyber**: Post-quantum key encapsulation

### Data Protection
- **End-to-End Encryption**: Messages encrypted client-side
- **Forward Secrecy**: Each message uses a new session key
- **Authentication**: MAC verification prevents tampering
- **Key Backup**: Secure export/import functionality

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Backend Deployment
```bash
# Configure production settings
# Set DEBUG=False, ALLOWED_HOSTS, etc.

# Collect static files
python manage.py collectstatic

# Use production WSGI server (gunicorn, uwsgi, etc.)
```

## 🔮 Future Enhancements

### Planned Features
- **Real Kyber Implementation**: Replace placeholder with actual WASM/JS Kyber
- **Message Signing**: Digital signatures for message authenticity
- **Group Messaging**: Encrypted group conversations
- **File Attachments**: Encrypted file sharing
- **Mobile App**: React Native version
- **Advanced Key Management**: Hardware security module support

### Technical Improvements
- **WebAssembly**: Optimized crypto operations
- **Service Workers**: Offline functionality
- **Push Notifications**: Real-time message alerts
- **End-to-End Testing**: Comprehensive test suite
- **Performance Optimization**: Lazy loading and caching

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the test page at `/test` for debugging
- Review the crypto implementation in `src/lib/crypto.ts`

---

**Note**: This is a prototype implementation. The Kyber implementation is currently a placeholder and should be replaced with a production-ready implementation for real-world use.
