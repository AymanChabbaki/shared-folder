const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ultex-cloud-secret-key-2026';

app.use(cors());
app.use(express.json());

// Set up the root directory for storage
let STORAGE_ROOT = '../shared_folder';

// Ensure storage root exists
try {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
} catch (err) {
  console.warn(`Could not access or create ${STORAGE_ROOT}. Falling back to local storage directory.`);
  STORAGE_ROOT = path.join(__dirname, 'storage');
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the target directory based on the request body 'path'
    const targetPath = req.body.path ? path.join(STORAGE_ROOT, req.body.path) : STORAGE_ROOT;
    
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Helper function to safely resolve paths
function getSafePath(userPath) {
  if (!userPath) return STORAGE_ROOT;
  // Prevent directory traversal attacks
  const safePath = path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '');
  return path.join(STORAGE_ROOT, safePath);
}

// Auth Middleware
function authenticateToken(req, res, next) {
  // Check header or query parameter (for downloads/views)
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// 0. POST /api/login - Authenticate user
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === 'Ultex2026@@') {
    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// 1. GET /api/files - List files and directories
app.get('/api/files', authenticateToken, (req, res) => {
  try {
    const queryPath = req.query.path || '';
    const targetDir = getSafePath(queryPath);

    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    
    const filesList = items.map(item => {
      const stat = fs.statSync(path.join(targetDir, item.name));
      return {
        name: item.name,
        isDirectory: item.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime
      };
    });

    res.json({
      currentPath: queryPath,
      items: filesList
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

// 2. POST /api/upload - Upload a file
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

// 3. POST /api/folder - Create a new folder
app.post('/api/folder', authenticateToken, (req, res) => {
  try {
    const { path: folderPath, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name is required' });
    
    const targetDir = getSafePath(folderPath);
    const newDirPath = path.join(targetDir, name);
    
    if (fs.existsSync(newDirPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }
    
    fs.mkdirSync(newDirPath, { recursive: true });
    res.json({ message: 'Folder created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// 4. GET /api/download - Download a file
app.get('/api/download', authenticateToken, (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const targetFile = getSafePath(filePath);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(path.resolve(targetFile));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// 5. GET /api/view - View a file in browser
app.get('/api/view', authenticateToken, (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const targetFile = getSafePath(filePath);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(path.resolve(targetFile));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// 6. DELETE /api/delete - Delete a file or folder
app.delete('/api/delete', authenticateToken, (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const targetFile = getSafePath(filePath);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Force deletion of file or directory recursively
    fs.rmSync(targetFile, { recursive: true, force: true });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Serve static frontend in production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback for React router
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
