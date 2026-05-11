import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { LobbyPage } from '@/pages/LobbyPage';
import { GamePage } from '@/pages/GamePage';
import { HomePage } from '@/pages/HomePage';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (user) connect();
  }, [user?.id]);

  return (
    <>
      <Header />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
          <Route path="/game/:roomId" element={<PrivateRoute><GamePage /></PrivateRoute>} />
        </Routes>
      </div>
    </>
  );
}
