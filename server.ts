import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { services, hashPassword } from './server/services/StorageService';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// Setup Multer for dynamic image uploads
const uploadDirBase = path.resolve(process.cwd(), 'public/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const moduleName = req.params.module || 'common';
    const dir = path.join(uploadDirBase, moduleName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Expose public folder for uploads
app.use('/uploads', express.static(uploadDirBase));

// Authentication Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

/* --- API ROUTING --- */

// --- Public APIs ---
app.get('/api/data', (req, res) => {
  try {
    const data = {
      home: services.home.read(),
      travels: services.travels.readAll(),
      bookmarks: services.bookmarks.readAll()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const settings = services.settings.read();
  const match = settings.passwordHash === hashPassword(password);

  if (match) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
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
    const settings = services.settings.read();
    settings.passwordHash = hashPassword(newPassword);
    services.settings.write(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Update Home 
app.put('/api/data/home', authenticateToken, (req, res) => {
  try {
    const oldHome = services.home.read();
    
    // Find old images
    const extractHomeUrls = (homeObj: any) => {
      const urls: string[] = [];
      if (homeObj.avatarUrl) urls.push(homeObj.avatarUrl);
      if (homeObj.customBlocks && Array.isArray(homeObj.customBlocks)) {
        homeObj.customBlocks.forEach((b: any) => {
          if (b.type === 'image' && b.url) urls.push(b.url);
        });
      }
      return urls;
    };
    const oldUrls = extractHomeUrls(oldHome);
    
    const newHome = { ...oldHome, ...req.body };
    const newUrls = extractHomeUrls(newHome);
    
    // Delete missing files
    oldUrls.forEach(url => {
      if (url && !newUrls.includes(url) && url.startsWith('/uploads/')) {
        const filePath = path.join(uploadDirBase, url.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    services.home.write(newHome);
    res.json({ success: true, home: newHome });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Travels
app.post('/api/data/travels', authenticateToken, (req, res) => {
  try {
    const newTravel = {
      id: Date.now().toString(),
      ...req.body
    };
    services.travels.add(newTravel);
    res.json(newTravel);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/data/travels/:id', authenticateToken, (req, res) => {
  try {
    const travel = services.travels.delete(req.params.id);
    if (travel) {
      const urlsToClean = travel.imageUrls || (travel.imageUrl ? [travel.imageUrl] : []);
      urlsToClean.forEach(url => {
        if (url && url.startsWith('/uploads/')) {
          const filePath = path.join(uploadDirBase, url.replace('/uploads/', ''));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/data/travels/:id', authenticateToken, (req, res) => {
  try {
    // We need to get old travel first to cleanup images. But our update method doesn't return old. 
    // We can fetch all and find it, or update could return old and new. Let's just readAll.
    const all = services.travels.readAll();
    const oldTravel = all.find(t => t.id === req.params.id);
    
    if (!oldTravel) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Find old images
    const oldUrls = oldTravel.imageUrls || (oldTravel.imageUrl ? [oldTravel.imageUrl] : []);
    
    // Find new images
    const newTravel = req.body;
    const newUrls = newTravel.imageUrls || (newTravel.imageUrl ? [newTravel.imageUrl] : []);
    
    // Delete missing files
    oldUrls.forEach(url => {
      if (url && !newUrls.includes(url) && url.startsWith('/uploads/')) {
        const filePath = path.join(uploadDirBase, url.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    const updated = services.travels.update(req.params.id, newTravel);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Bookmarks
app.post('/api/data/bookmarks', authenticateToken, (req, res) => {
  try {
    const newBookmark = {
      id: Date.now().toString(),
      ...req.body
    };
    services.bookmarks.add(newBookmark);
    res.json(newBookmark);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/data/bookmarks/:id', authenticateToken, (req, res) => {
  try {
    services.bookmarks.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Upload endpoint with dynamic generic sub-directory routing
app.post('/api/upload/:module', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const moduleName = req.params.module || 'common';
  // Public URL to access the uploaded file
  const imageUrl = `/uploads/${moduleName}/${req.file.filename}`;
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
