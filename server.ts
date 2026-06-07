import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { services, hashPassword, CoreStorage } from './server/services/StorageService';
import { BackupService, addImagesToArchive } from './server/services/BackupService';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import AdmZip from 'adm-zip';
// @ts-ignore
import { ZipArchive } from 'archiver';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Initialize Backup Scheduler
BackupService.initialize();

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
    let isAdmin = false;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.admin) isAdmin = true;
        if (decoded.role === 'admin' || decoded.role === 'travel' || decoded.admin) {
          isTravelAuthorized = true;
        }
      } catch (err) {
        // invalid token
      }
    }

    const data: any = {
      home: services.home.read(),
      travels: isTravelAuthorized ? services.travels.readAll() : [],
      isTravelAuthorized,
      bookmarks: services.bookmarks.readAll()
    };
    if (isAdmin) {
      data.backupSettings = services.settings.read().backupSettings || {
        enabled: false,
        frequency: 'daily',
        dayOfWeek: 1,
        time: '02:00',
        retentionCount: 1
      };
    }
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

app.put('/api/data/backup/settings', authenticateToken, (req, res) => {
  try {
    const backupSettings = req.body;
    const settings = services.settings.read();
    settings.backupSettings = backupSettings;
    services.settings.write(settings);
    BackupService.scheduleNextBackup();
    res.json({ success: true, backupSettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update backup settings' });
  }
});

app.post('/api/data/backup/trigger', authenticateToken, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const settings = services.settings.read();
    const retentionCount = settings.backupSettings?.retentionCount || 1;
    const filename = await BackupService.performBackup(retentionCount, (progress) => {
      sendEvent({ type: 'progress', progress });
    });
    sendEvent({ type: 'complete', filename });
    res.end();
  } catch (error) {
    sendEvent({ type: 'error', message: 'Failed to perform backup' });
    res.end();
  }
});

app.get('/api/data/export', authenticateToken, (req, res) => {
  try {
    const archive = new ZipArchive({ zlib: { level: 9 } });

    // 计算所有文件的未压缩总大小，用于前端进度显示
    let totalSize = 0;
    const statSize = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
          statSize(filepath);
        } else {
          // 不导出密码配置文件
          if (file === 'settings.json' || file === 'settings.json.tmp') return;
          totalSize += stat.size;
        }
      });
    };
    
    const dataDir = path.resolve(process.cwd(), 'data');
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    
    statSize(dataDir);
    statSize(uploadDir);

    // 将总大小通过 header 返回给前端计算百分比
    res.setHeader('X-Total-Size', totalSize.toString());
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Total-Size');
    
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}_${pad(now.getUTCHours())}-${pad(now.getUTCMinutes())}-${pad(now.getUTCSeconds())}`;

    res.attachment(`export-${timestamp}.zip`);
    archive.pipe(res);

    archive.on('error', (err) => {
      throw err;
    });

    if (fs.existsSync(dataDir)) {
      const walkAndAddDecrypted = (dir: string, baseZipDir: string) => {
        fs.readdirSync(dir).forEach(file => {
          const filepath = path.join(dir, file);
          if (fs.statSync(filepath).isDirectory()) {
            walkAndAddDecrypted(filepath, `${baseZipDir}/${file}`);
          } else if (file === 'settings.json' || file === 'settings.json.tmp') {
            return; // Skip exporting sensitive settings
          } else if (file.endsWith('.json')) {
            const content = fs.readFileSync(filepath, 'utf-8');
            try {
              const decrypted = CoreStorage.decrypt(content);
              JSON.parse(decrypted); // ensure it's valid JSON
              archive.append(Buffer.from(decrypted, 'utf-8'), { name: `${baseZipDir}/${file}` });
            } catch (e) {
              // fallback if not encrypted or invalid json
              archive.file(filepath, { name: `${baseZipDir}/${file}` });
            }
          } else {
             archive.file(filepath, { name: `${baseZipDir}/${file}` });
          }
        });
      };
      walkAndAddDecrypted(dataDir, 'data');
    }

    addImagesToArchive(archive);

    archive.finalize();
  } catch (error: any) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export' });
    }
  }
});

function getImportData<T>(filePath: string): T | null {
  const data = CoreStorage.read(filePath);
  if (data !== null) return data;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function performImport(extractDir: string, strategy: 'merge' | 'replace') {
  const tempTravelsDir = path.join(extractDir, 'data', 'travels');
  let importedTravels: any[] = [];
  if (fs.existsSync(tempTravelsDir)) {
    const chunks = fs.readdirSync(tempTravelsDir).filter(f => f.startsWith('chunk_') && f.endsWith('.json'));
    for (const chunk of chunks) {
      const data = getImportData<any[]>(path.join(tempTravelsDir, chunk)) || [];
      if (Array.isArray(data)) importedTravels = importedTravels.concat(data);
    }
  }

  const tempBookmarksDir = path.join(extractDir, 'data', 'bookmarks');
  let importedBookmarks: any[] = [];
  if (fs.existsSync(tempBookmarksDir)) {
    const chunks = fs.readdirSync(tempBookmarksDir).filter(f => f.startsWith('chunk_') && f.endsWith('.json'));
    for (const chunk of chunks) {
      const data = getImportData<any[]>(path.join(tempBookmarksDir, chunk)) || [];
      if (Array.isArray(data)) importedBookmarks = importedBookmarks.concat(data);
    }
  }

  const homePath = path.join(extractDir, 'data', 'home.json');
  let importedHome: any = null;
  if (fs.existsSync(homePath)) {
    importedHome = getImportData<any>(homePath);
  }

  const localTravels = services.travels.readAll();
  const localBookmarks = services.bookmarks.readAll();

  let finalTravels: any[] = [];
  let finalBookmarks: any[] = [];

  if (strategy === 'merge') {
    const importedTravelIds = new Set(importedTravels.map(t => t.id));
    const localOnlyTravels = localTravels.filter(t => !importedTravelIds.has(t.id));
    finalTravels = [...localOnlyTravels, ...importedTravels];

    const importedBookmarkIds = new Set(importedBookmarks.map(b => b.id));
    const localOnlyBookmarks = localBookmarks.filter(b => !importedBookmarkIds.has(b.id));
    finalBookmarks = [...localOnlyBookmarks, ...importedBookmarks];
  } else {
    finalTravels = importedTravels;
    finalBookmarks = importedBookmarks;
  }

  const getTravelImagePaths = (travels: any[]) => {
    const paths = new Set<string>();
    for (const t of travels) {
      if (t.imageUrl && typeof t.imageUrl === 'string' && t.imageUrl.startsWith('/uploads/')) {
        paths.add(t.imageUrl);
      }
      if (t.imageUrls && Array.isArray(t.imageUrls)) {
        t.imageUrls.forEach((url: any) => {
          if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
            paths.add(url);
          }
        });
      }
    }
    return paths;
  };

  const oldPaths = getTravelImagePaths(localTravels);
  const newPaths = getTravelImagePaths(finalTravels);

  for (const p of oldPaths) {
    if (!newPaths.has(p)) {
      const fullPath = path.join(process.cwd(), 'public', p.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          const dir = path.dirname(fullPath);
          if (fs.readdirSync(dir).length === 0) {
            fs.rmdirSync(dir);
          }
        } catch (e) {
          console.error('Failed to delete orphaned image:', fullPath, e);
        }
      }
    }
  }

  services.travels.writeAll(finalTravels);
  services.bookmarks.writeAll(finalBookmarks);

  if (importedHome) {
    services.home.write({...services.home.read(), ...importedHome});
  }

  const extractedUploadsDir = path.join(extractDir, 'public/uploads');
  const targetUploadsDir = path.resolve(process.cwd(), 'public/uploads');

  if (fs.existsSync(extractedUploadsDir)) {
    const walkAndCopyDir = (src: string, dest: string, subdir: string = '') => {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(file => {
        const srcFile = path.join(src, file);
        const currentSubdir = subdir ? `${subdir}/${file}` : file;

        if (fs.statSync(srcFile).isDirectory()) {
          walkAndCopyDir(srcFile, dest, currentSubdir);
        } else {
          let targetPath = path.join(dest, currentSubdir);

          const parts = currentSubdir.replace(/\\/g, '/').split('/');
          if (parts[0] === 'travels' && parts.length > 2) {
            targetPath = path.join(dest, 'travels', file);
            if (!fs.existsSync(path.join(dest, 'travels'))) {
              fs.mkdirSync(path.join(dest, 'travels'), { recursive: true });
            }
          } else {
            const parentDir = path.dirname(targetPath);
            if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
          }

          fs.copyFileSync(srcFile, targetPath);
        }
      });
    };
    walkAndCopyDir(extractedUploadsDir, targetUploadsDir);
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
}

app.post('/api/data/import/analyze', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempDirId = 'temp_import_' + Date.now();
    const extractDir = path.resolve(process.cwd(), tempDirId);
    
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(extractDir, true);
    fs.unlinkSync(req.file.path);

    const tempTravelsDir = path.join(extractDir, 'data', 'travels');
    let importedTravels: any[] = [];
    if (fs.existsSync(tempTravelsDir)) {
      const chunks = fs.readdirSync(tempTravelsDir).filter(f => f.startsWith('chunk_') && f.endsWith('.json'));
      for (const chunk of chunks) {
        const data = getImportData<any[]>(path.join(tempTravelsDir, chunk)) || [];
        if (Array.isArray(data)) importedTravels = importedTravels.concat(data);
      }
    }

    const localTravels = services.travels.readAll();
    const importedTravelIds = new Set(importedTravels.map(t => t.id));
    const localOnlyCount = localTravels.filter(t => !importedTravelIds.has(t.id)).length;

    if (localOnlyCount > 0) {
      return res.json({ status: 'conflict', tempDirId, localOnlyCount });
    }

    // No conflict, merge directly (replace/merge is equivalent here as localOnlyCount is 0)
    await performImport(extractDir, 'merge');
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Import analyze error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to analyze import' });
  }
});

app.post('/api/data/import/execute', authenticateToken, async (req, res) => {
  try {
    const { tempDirId, strategy } = req.body;
    if (!tempDirId || !['merge', 'replace'].includes(strategy)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    const extractDir = path.resolve(process.cwd(), tempDirId);
    if (!fs.existsSync(extractDir)) {
      return res.status(404).json({ error: 'Temp directory not found or expired' });
    }

    await performImport(extractDir, strategy);
    res.json({ success: true });
  } catch (error) {
    console.error('Import execute error:', error);
    res.status(500).json({ error: 'Failed to execute import' });
  }
});

app.post('/api/data/import/cancel', authenticateToken, (req, res) => {
  try {
    const { tempDirId } = req.body;
    if (tempDirId) {
      const extractDir = path.resolve(process.cwd(), tempDirId);
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel import' });
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
