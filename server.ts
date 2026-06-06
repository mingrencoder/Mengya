import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { services, hashPassword, CoreStorage } from './server/services/StorageService';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import AdmZip from 'adm-zip';

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
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user: any) => {
    if (err) return res.sendStatus(403);
    
    // Check if the user is an admin
    if (user.role !== 'admin' && user.admin !== true) {
      return res.sendStatus(403);
    }
    
    (req as any).user = user;
    next();
  });
};

/* --- API ROUTING --- */

// --- Public APIs ---
app.get('/api/data', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    let isTravelAuthorized = false;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.role === 'travel' || decoded.admin) {
          isTravelAuthorized = true;
        }
      } catch (err) {
        // invalid token
      }
    }

    const data = {
      home: services.home.read(),
      travels: isTravelAuthorized ? services.travels.readAll() : [],
      isTravelAuthorized,
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
app.post('/api/auth/travel-login', (req, res) => {
  const { password } = req.body;
  const settings = services.settings.read();
  
  // if not set yet, fallback to 123321
  const expectedHash = settings.travelPasswordHash || hashPassword('123321');
  const match = expectedHash === hashPassword(password);

  if (match) {
    const token = jwt.sign({ role: 'travel' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Update Password
app.put('/api/auth/password', authenticateToken, (req, res) => {
  try {
    const { newPassword, travelPassword } = req.body;
    const settings = services.settings.read();
    
    if (newPassword) {
      settings.passwordHash = hashPassword(newPassword);
    }
    if (travelPassword) {
      settings.travelPasswordHash = hashPassword(travelPassword);
    }
    
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

    // Find new images
    const newTravel = req.body;
    
    if (newTravel.imageUrls !== undefined || newTravel.imageUrl !== undefined) {
      const oldUrls = oldTravel.imageUrls || (oldTravel.imageUrl ? [oldTravel.imageUrl] : []);
      const newUrls = newTravel.imageUrls || (newTravel.imageUrl ? [newTravel.imageUrl] : []);
      
      // Delete missing files
      oldUrls.forEach(url => {
        if (url && !newUrls.includes(url) && url.startsWith('/uploads/')) {
          const filePath = path.join(uploadDirBase, url.replace('/uploads/', ''));
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              console.error('Failed to unlink file', filePath, e);
            }
          }
        }
      });
    }

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

app.get('/api/data/export', authenticateToken, (req, res) => {
  try {
    const homeData = services.home.read();
    const travelsData = services.travels.readAll();
    const bookmarksData = services.bookmarks.readAll();

    const referencedUrls = new Set<string>();
    if (homeData.avatarUrl) referencedUrls.add(homeData.avatarUrl);
    if (homeData.customBlocks && Array.isArray(homeData.customBlocks)) {
      homeData.customBlocks.forEach((b: any) => {
        if (b.type === 'image' && b.url) referencedUrls.add(b.url);
      });
    }
    travelsData.forEach(t => {
      if (t.imageUrl) referencedUrls.add(t.imageUrl);
      if (t.imageUrls) t.imageUrls.forEach(u => referencedUrls.add(u));
    });
    bookmarksData.forEach(b => {
      if ((b as any).iconUrl) referencedUrls.add((b as any).iconUrl);
      if ((b as any).coverUrl) referencedUrls.add((b as any).coverUrl);
    });

    const walkSync = (dir: string, filelist: string[] = []) => {
      if (!fs.existsSync(dir)) return filelist;
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
          filelist = walkSync(filepath, filelist);
        } else {
          filelist.push(filepath);
        }
      });
      return filelist;
    };

    if (fs.existsSync(uploadDirBase)) {
      const allFiles = walkSync(uploadDirBase);
      allFiles.forEach(file => {
        const relativePath = '/uploads/' + path.relative(uploadDirBase, file).replace(/\\/g, '/');
        if (!referencedUrls.has(relativePath)) {
          fs.unlinkSync(file);
        }
      });
    }

    const zip = new AdmZip();

    const dataDir = path.resolve(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      const walkAndAddDecrypted = (dir: string, baseZipDir: string) => {
        fs.readdirSync(dir).forEach(file => {
          const filepath = path.join(dir, file);
          if (fs.statSync(filepath).isDirectory()) {
            walkAndAddDecrypted(filepath, path.join(baseZipDir, file).replace(/\\/g, '/'));
          } else if (file.endsWith('.json')) {
            const content = fs.readFileSync(filepath, 'utf-8');
            try {
              const decrypted = CoreStorage.decrypt(content);
              JSON.parse(decrypted); // ensure it's valid JSON
              zip.addFile(`${baseZipDir}/${file}`, Buffer.from(decrypted, 'utf-8'));
            } catch (e) {
              zip.addFile(`${baseZipDir}/${file}`, Buffer.from(content, 'utf-8'));
            }
          } else {
             zip.addLocalFile(filepath, baseZipDir);
          }
        });
      };
      walkAndAddDecrypted(dataDir, 'data');
    }

    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    if (fs.existsSync(uploadDir)) {
      zip.addLocalFolder(uploadDir, 'public/uploads');
    }

    const buffer = zip.toBuffer();
    res.attachment('export.zip');
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export', message: error.message, stack: error.stack });
  }
});

app.post('/api/data/import', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const zip = new AdmZip(req.file.path);
    const extractDir = path.resolve(process.cwd(), 'temp_extract_' + Date.now());
    
    zip.extractAllTo(extractDir, true);

    const extractedDataDir = path.join(extractDir, 'data');
    if (fs.existsSync(extractedDataDir)) {
      const walkAndEncrypt = (dir: string, targetDir: string) => {
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.readdirSync(dir).forEach(file => {
          const filepath = path.join(dir, file);
          const targetPath = path.join(targetDir, file);
          if (fs.statSync(filepath).isDirectory()) {
            walkAndEncrypt(filepath, targetPath);
          } else if (file.endsWith('.json')) {
            const data = fs.readFileSync(filepath, 'utf-8');
            try {
              JSON.parse(data);
              const encrypted = CoreStorage.encrypt(data);
              fs.writeFileSync(targetPath, encrypted, 'utf-8');
            } catch (e) {
              fs.copyFileSync(filepath, targetPath);
            }
          } else {
            fs.copyFileSync(filepath, targetPath);
          }
        });
      };
      
      const targetDataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(targetDataDir)) fs.mkdirSync(targetDataDir, { recursive: true });
      walkAndEncrypt(extractedDataDir, targetDataDir);
    }

    const extractedUploadsDir = path.join(extractDir, 'public/uploads');
    if (fs.existsSync(extractedUploadsDir)) {
      const targetUploadsDir = path.resolve(process.cwd(), 'public/uploads');
      if (!fs.existsSync(targetUploadsDir)) fs.mkdirSync(targetUploadsDir, { recursive: true });
      fs.cpSync(extractedUploadsDir, targetUploadsDir, { recursive: true });
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.unlinkSync(req.file.path);

    // Refresh context data will be handled by client fetching /api/data again
    res.json({ success: true });
  } catch (error) {
    console.error('Import error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import' });
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
