import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { uploadFile } from '../api';

export default function UploadZone({ currentPath, onUploadComplete }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

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

  const processFile = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      await uploadFile(file, currentPath, (percent) => {
        setProgress(percent);
      });
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
      // Just taking the first file for simplicity, but could be extended to multiple
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
      // Reset input so the same file can be selected again if needed
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
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      
      <UploadCloud size={48} className="upload-icon" />
      
      <div className="upload-text">
        {isUploading ? 'Uploading...' : 'Click or drag file to this area to upload'}
      </div>
      
      {!isUploading && (
        <div className="upload-subtext">
          Supports any file format. It will be uploaded to the current directory.
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
