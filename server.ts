import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import * as jsonwebtoken from 'jsonwebtoken';
import { StorageService, hashPassword } from './server/services/StorageService';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// Initialize Storage
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const storageService = new StorageService(path.join(dataDir, 'content.json'));
storageService.init();

const currentData = storageService.read();
if (!currentData.settings || !currentData.settings.passwordHash) {
  currentData.settings = {
    ...currentData.settings,
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'supersecretpassword')
  };
  storageService.write(currentData);
}

// Setup Multer for image uploads
const uploadDir = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Expose public folder for uploads
app.use('/uploads', express.static(uploadDir));

// Authentication Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jsonwebtoken.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

/* --- API ROUTING --- */

// --- Public APIs ---
app.get('/api/data', (req, res) => {
  try {
    const data = storageService.read();
    const { settings, ...publicData } = data;
    res.json(publicData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const data = storageService.read();
  const storedHash = data.settings?.passwordHash;
  const match = storedHash === hashPassword(password);

  if (match) {
    const token = jsonwebtoken.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// --- Protected APIs ---
// Update Password
app.put('/api/auth/password', authenticateToken, (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Password required' });
    const data = storageService.read();
    data.settings = { ...data.settings, passwordHash: hashPassword(newPassword) };
    storageService.write(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Update Home 
app.put('/api/data/home', authenticateToken, (req, res) => {
  try {
    const data = storageService.read();
    data.home = { ...data.home, ...req.body };
    storageService.write(data);
    res.json({ success: true, home: data.home });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Travels
app.post('/api/data/travels', authenticateToken, (req, res) => {
  try {
    const data = storageService.read();
    const newTravel = {
      id: Date.now().toString(),
      ...req.body
    };
    data.travels.push(newTravel);
    storageService.write(data);
    res.json(newTravel);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/data/travels/:id', authenticateToken, (req, res) => {
  try {
    const data = storageService.read();
    data.travels = data.travels.filter(t => t.id !== req.params.id);
    storageService.write(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Bookmarks
app.post('/api/data/bookmarks', authenticateToken, (req, res) => {
  try {
    const data = storageService.read();
    const newBookmark = {
      id: Date.now().toString(),
      ...req.body
    };
    data.bookmarks.push(newBookmark);
    storageService.write(data);
    res.json(newBookmark);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Public URL to access the uploaded file
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});


// Vite / Frontend integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Check if dist exists, some environments might run building in parallel but assume it's created
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
