import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { getMeRequest, loginRequest, logoutRequest, signupRequest } from '../api/authApi';
import { LoginPayload, SignupPayload, User } from '../types/auth.types';
import {
  broadcastSyncEvent,
  setStoredConversationId,
  subscribeSyncEvents,
} from '../utils/tabSync';
import { clearToken, getToken, setToken } from '../utils/tokenStorage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const hydrateSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: currentUser } = await getMeRequest();
      setUser(currentUser);
    } catch {
      clearToken();
      setStoredConversationId(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    return subscribeSyncEvents((event) => {
      if (event.type === 'AUTH_LOGOUT') {
        clearToken();
        setStoredConversationId(null);
        setUser(null);
      } else if (event.type === 'AUTH_LOGIN') {
        void hydrateSession();
      }
    });
  }, [hydrateSession]);

  const login = async (payload: LoginPayload) => {
    const data = await loginRequest(payload);
    setToken(data.token);
    setUser(data.user);
    broadcastSyncEvent({ type: 'AUTH_LOGIN' });
  };

  const signup = async (payload: SignupPayload) => {
    const data = await signupRequest(payload);
    setToken(data.token);
    setUser(data.user);
    broadcastSyncEvent({ type: 'AUTH_LOGIN' });
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      clearToken();
    } finally {
      clearToken();
      setStoredConversationId(null);
      setUser(null);
      broadcastSyncEvent({ type: 'AUTH_LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
