import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ currentPath, onNavigate }) {
  const parts = currentPath ? currentPath.split('/') : [];
  
  const handleNav = (index) => {
    if (index === -1) {
      onNavigate('');
    } else {
      const newPath = parts.slice(0, index + 1).join('/');
      onNavigate(newPath);
    }
  };

  return (
    <div className="breadcrumbs glass">
      <div 
        className={`breadcrumb-item ${parts.length === 0 ? 'breadcrumb-active' : ''}`}
        onClick={() => handleNav(-1)}
      >
        <Home size={18} />
      </div>
      
      {parts.map((part, index) => {
        if (!part) return null;
        const isLast = index === parts.length - 1;
        
        return (
          <React.Fragment key={index}>
            <ChevronRight size={16} className="breadcrumb-separator" />
            <div 
              className={`breadcrumb-item ${isLast ? 'breadcrumb-active' : ''}`}
              onClick={() => !isLast && handleNav(index)}
            >
              {part}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
