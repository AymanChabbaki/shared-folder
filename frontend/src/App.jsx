import React, { useState, useEffect } from 'react';
import { Cloud, LogOut } from 'lucide-react';
import FileManager from './components/FileManager';
import Login from './components/Login';
import { setAuthToken } from './api';
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('ultex_token') || null);

  useEffect(() => {
    // Set the token on initial load
    if (token) setAuthToken(token);
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem('ultex_token', newToken);
    setAuthToken(newToken); // Set this synchronously before state update
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('ultex_token');
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <div className="logo">
          <Cloud size={32} className="logo-icon" />
          <h1>Ultex Cloud</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </header>

      <main className="glass" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <FileManager />
      </main>
    </div>
  );
}

export default App;
