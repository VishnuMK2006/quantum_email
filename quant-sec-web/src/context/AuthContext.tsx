import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserStorage, UserData } from '@/lib/api';

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: string | null;
  login: (userData: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  currentUser: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    setCurrentUser(localStorage.getItem('currentUser'));
  }, []);

  const login = (userData: UserData) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', userData.username);
    UserStorage.storeUserData(userData);
    setIsLoggedIn(true);
    setCurrentUser(userData.username);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    UserStorage.clearUserData();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 