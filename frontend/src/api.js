export const API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

let currentToken = localStorage.getItem('ultex_token') || null;
export const setAuthToken = (token) => {
  currentToken = token;
};

const getHeaders = () => {
  const headers = {};
  const t = localStorage.getItem('ultex_token');
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }
  return headers;
};

export const fetchFiles = async (path = '') => {
  const res = await fetch(`${API_URL}/files?path=${encodeURIComponent(path)}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
};

export const uploadFile = async (file, path = '', onProgress) => {
  const formData = new FormData();
  formData.append('path', path);
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', `${API_URL}/upload`);
    if (currentToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.send(formData);
  });
};

export const createFolder = async (name, path = '') => {
  const res = await fetch(`${API_URL}/folder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ path, name }),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return res.json();
};

export const downloadFileUrl = (fileName, currentPath) => {
  const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
  let url = `${API_URL}/download?path=${encodeURIComponent(fullPath)}`;
  if (currentToken) url += `&token=${currentToken}`;
  return url;
};

export const viewFileUrl = (fileName, currentPath) => {
  const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
  let url = `${API_URL}/view?path=${encodeURIComponent(fullPath)}`;
  const t = localStorage.getItem('ultex_token');
  if (t) url += `&token=${t}`;
  return url;
};

export const deleteItem = async (path) => {
  const res = await fetch(`${API_URL}/delete?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return res.json();
};
