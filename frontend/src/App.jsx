import { useState, useEffect } from 'react';
import { FolderGit2 } from 'lucide-react';
import FileManager from './components/FileManager';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header glass" style={{ padding: '1rem 2rem', marginBottom: '1rem' }}>
        <div className="app-title">
          <FolderGit2 size={36} color="#60a5fa" />
          <span>Ultex Cloud</span>
        </div>
      </header>

      <main className="glass" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <FileManager />
      </main>
    </div>
  );
}

export default App;
