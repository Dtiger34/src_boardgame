import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LobbyPage } from '@/pages/LobbyPage';
import { GamePage } from '@/pages/GamePage';
import { HomePage } from '@/pages/HomePage';
import { useAuthStore } from '@/store/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const tokens = useAuthStore((s) => s.tokens);
  return tokens ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
      <Route path="/game/:roomId" element={<PrivateRoute><GamePage /></PrivateRoute>} />
    </Routes>
  );
}
