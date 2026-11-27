import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="screen-center">
        <div className="loader" />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
};
