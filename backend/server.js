const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 1. GET /api/files - List files and directories
app.get('/api/files', (req, res) => {
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
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

// 3. POST /api/folder - Create a new folder
app.post('/api/folder', (req, res) => {
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
app.get('/api/download', (req, res) => {
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
app.get('/api/view', (req, res) => {
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

// Serve static frontend in production
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback for React router
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
