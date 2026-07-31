import React from 'react';
import { Folder, File, Download, Eye, Trash2 } from 'lucide-react';
import { downloadFileUrl, viewFileUrl } from '../api';

export default function FileGrid({ files, currentPath, onNavigate, onDelete }) {
  if (!files || files.length === 0) {
    return (
      <div className="empty-state glass">
        <Folder size={64} className="empty-icon" />
        <h2>This folder is empty</h2>
        <p>Drag and drop files to upload, or create a new folder.</p>
      </div>
    );
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleItemClick = (item) => {
    if (item.isDirectory) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      onNavigate(newPath);
    }
  };

  const handleDownload = (e, item) => {
    e.stopPropagation();
    const url = downloadFileUrl(item.name, currentPath);
    // Create a temporary link to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleView = (e, item) => {
    e.stopPropagation();
    const url = viewFileUrl(item.name, currentPath);
    window.open(url, '_blank');
  };

  const handleDelete = (e, item) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${item.name}"?`)) {
      onDelete(item);
    }
  };

  return (
    <div className="file-grid">
      {files.map((item, index) => (
        <div 
          key={index} 
          className="file-item glass"
          onClick={() => handleItemClick(item)}
        >
          <div className="file-icon">
            {/* 
              USER NOTE: 
              Replace the <Folder /> and <File /> icons below with your big image paths when you have them.
              Example: <img src="/assets/folder-big-image.png" alt="folder" style={{ width: '100%', height: '100%' }} /> 
            */}
            {item.isDirectory ? (
              <Folder size={64} color="#60a5fa" strokeWidth={1.5} />
            ) : (
              <File size={64} color="#c084fc" strokeWidth={1.5} />
            )}
          </div>
          
          <div className="file-name" title={item.name}>
            {item.name}
          </div>
          
          <div className="file-meta">
            {!item.isDirectory && formatSize(item.size)}
            {item.isDirectory && 'Folder'}
          </div>

          <div className="file-actions">
            {!item.isDirectory && (
              <>
                <button 
                  className="icon-btn" 
                  title="View"
                  onClick={(e) => handleView(e, item)}
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="icon-btn" 
                  title="Download"
                  onClick={(e) => handleDownload(e, item)}
                >
                  <Download size={16} />
                </button>
              </>
            )}
            {/* 
              USER NOTE: Delete button is hidden per request.
              Uncomment the button below to re-enable deletion from the frontend.
            */}
            {/*
            <button 
              className="icon-btn" 
              title="Delete"
              onClick={(e) => handleDelete(e, item)}
              style={{ color: '#ef4444' }}
            >
              <Trash2 size={16} />
            </button>
            */}
          </div>
        </div>
      ))}
    </div>
  );
}
