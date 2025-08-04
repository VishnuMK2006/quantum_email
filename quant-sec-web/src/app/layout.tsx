'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeRegistry from '../components/ThemeRegistry';
import { AuthProvider, useAuth } from '../context/AuthContext';

function LayoutWithAuth({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn && (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/compose') ||
      pathname.startsWith('/inbox') ||
      pathname.startsWith('/keys') ||
      pathname.startsWith('/test')
    )) {
      router.replace('/login');
    }
  }, [pathname, router, isLoggedIn]);

  return (
    <ThemeRegistry>
      {children}
    </ThemeRegistry>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutWithAuth>{children}</LayoutWithAuth>
        </AuthProvider>
      </body>
    </html>
  );
}
