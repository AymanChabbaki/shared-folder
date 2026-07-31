import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { uploadFile } from '../api';

export default function UploadZone({ currentPath, onUploadComplete }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const processFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      let completed = 0;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Preserve folder structure if webkitRelativePath exists
        let targetPath = currentPath;
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            const relativeDir = parts.slice(0, -1).join('/');
            targetPath = currentPath ? `${currentPath}/${relativeDir}` : relativeDir;
          }
        }
        
        await uploadFile(file, targetPath, (percent) => {
          const overallProgress = ((completed * 100) + percent) / fileList.length;
          setProgress(overallProgress);
        });
        completed++;
      }
      onUploadComplete();
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileClick = (e) => {
    e.stopPropagation();
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleFolderClick = (e) => {
    e.stopPropagation();
    if (!isUploading) folderInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div 
      className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        webkitdirectory=""
        directory=""
        multiple
        ref={folderInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      
      <UploadCloud size={48} className="upload-icon" />
      
      <div className="upload-text">
        {isUploading ? 'Uploading...' : 'Drag & drop files here or use the buttons below'}
      </div>
      
      {!isUploading && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', zIndex: 2 }}>
          <button className="btn" onClick={handleFileClick}>Select Files</button>
          <button className="btn btn-primary" onClick={handleFolderClick}>Upload Folder</button>
        </div>
      )}

      {isUploading && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}
