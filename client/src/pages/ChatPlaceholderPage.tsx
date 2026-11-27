import { useAuth } from '../context/AuthContext';

export const ChatPlaceholderPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="workspace-shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand-badge">Support AI</span>
          <span className="topbar-title">Customer Support Workspace</span>
        </div>
        <div className="topbar-right">
          <div className="user-pill">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn-secondary" onClick={() => void logout()}>
            Log Out
          </button>
        </div>
      </header>
      <main className="placeholder-main">
        <div className="placeholder-card">
          <h2>Authenticated as {user?.name}</h2>
          <p>Your session is active. Chat interface will be connected here next.</p>
        </div>
      </main>
    </div>
  );
};
