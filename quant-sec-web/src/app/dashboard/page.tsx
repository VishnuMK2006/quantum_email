"use client";
import { useRouter } from "next/navigation";
import { AppBar, Toolbar, Button, Box, Typography, Paper, Stack } from "@mui/material";
import { useAuth } from '@/context/AuthContext';

const features = [
  { label: "Compose Email", path: "/compose" },
  { label: "Inbox", path: "/inbox" },
  { label: "Key Management", path: "/keys" },
  { label: "Test Crypto", path: "/test" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Box>
      <AppBar position="static" color="default" sx={{ mb: 2 }}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Quantum Secure Email Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {currentUser && (
              <Typography variant="body2">
                Logged in as: <b>{currentUser}</b>
              </Typography>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Paper sx={{ p: 4, minHeight: 400 }}>
        <Typography variant="h5" align="center" sx={{ mt: 4, mb: 4 }}>
          Welcome to your dashboard! Use the buttons below to access features.
        </Typography>
        <Stack spacing={2} direction="row" justifyContent="center">
          {features.map((f) => (
            <Button key={f.label} variant="contained" onClick={() => router.push(f.path)}>
              {f.label}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
} 