import React, { useState, useEffect, useCallback } from 'react';
import { fetchFiles, uploadFile, createFolder, deleteItem } from '../api';
import Breadcrumbs from './Breadcrumbs';
import UploadZone from './UploadZone';
import FileGrid from './FileGrid';
import { FolderPlus, RefreshCw, Search } from 'lucide-react';

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFiles(currentPath);
      // Sort folders first, then files
      const sorted = (data.items || []).sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      setFiles(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Prevent browser from opening files when dropped outside the upload zone
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleNavigate = (path) => {
    setCurrentPath(path);
  };

  const handleUploadComplete = () => {
    loadFiles();
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder(newFolderName, currentPath);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (item) => {
    try {
      const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      await deleteItem(fullPath);
      loadFiles();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Breadcrumbs currentPath={currentPath} onNavigate={handleNavigate} />
      
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '250px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ margin: 0, paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={loadFiles} title="Refresh">
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          
          <button className="btn btn-primary" onClick={() => setIsCreatingFolder(true)}>
            <FolderPlus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      <UploadZone currentPath={currentPath} onUploadComplete={handleUploadComplete} />

      {error && <div style={{ color: 'var(--danger-color)', padding: '1rem', textAlign: 'center' }}>Error: {error}</div>}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading files...</div>
      ) : (
        <FileGrid 
          files={files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))} 
          currentPath={currentPath} 
          onNavigate={handleNavigate} 
          onDelete={handleDelete}
        />
      )}

      {/* New Folder Modal */}
      {isCreatingFolder && (
        <div className="overlay" onClick={() => setIsCreatingFolder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Create New Folder</div>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                className="input-field"
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setIsCreatingFolder(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
