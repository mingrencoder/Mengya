import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
// @ts-ignore
import { ZipArchive } from 'archiver';
import { services, CoreStorage } from './StorageService';

export function addImagesToArchive(archive: any) {
  const uploadDir = path.resolve(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) return;

  const travels = services.travels.readAll();
  const imageToFolder = new Map<string, string>();

  const sanitize = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  travels.forEach(t => {
     const date = t.date || 'unknown_date';
     const loc = t.location || 'unknown_location';
     const title = t.title || 'unknown_title';
     const folderName = sanitize(`${date}_${loc}_${title}`);
     
     if (t.imageUrl && t.imageUrl.startsWith('/uploads/')) {
         imageToFolder.set(t.imageUrl.replace('/uploads/', ''), folderName);
     }
     if (t.imageUrls) {
         t.imageUrls.forEach(url => {
             if (url && url.startsWith('/uploads/')) {
                 imageToFolder.set(url.replace('/uploads/', ''), folderName);
             }
         });
     }
  });

  const walkAndAddPhotos = (dir: string, baseRelativePath: string) => {
      fs.readdirSync(dir).forEach(file => {
          const filepath = path.join(dir, file);
          const relativePath = baseRelativePath ? `${baseRelativePath}/${file}` : file;
          
          if (fs.statSync(filepath).isDirectory()) {
              walkAndAddPhotos(filepath, relativePath);
          } else {
              if (imageToFolder.has(relativePath)) {
                  const folder = imageToFolder.get(relativePath)!;
                  archive.file(filepath, { name: `public/uploads/travels/${folder}/${file}` });
              } else {
                  archive.file(filepath, { name: `public/uploads/${relativePath}` });
              }
          }
      });
  };

  walkAndAddPhotos(uploadDir, '');
}

export class BackupService {
  private static task: ScheduledTask | null = null;
  private static backupsDir = path.resolve(process.cwd(), 'backups');

  public static listBackups() {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }
    const files = fs.readdirSync(this.backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
      .map(f => {
        const stats = fs.statSync(path.join(this.backupsDir, f));
        return {
          filename: f,
          size: stats.size,
          time: stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.time - a.time);
    return files;
  }

  public static getBackupPath(filename: string): string | null {
    if (!filename.match(/^backup-.*\.zip$/)) return null;
    const filepath = path.join(this.backupsDir, filename);
    if (!fs.existsSync(filepath)) return null;
    return filepath;
  }

  public static initialize() {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
    this.scheduleNextBackup();
  }

  public static scheduleNextBackup() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    const settings = services.settings.read();
    const backupSettings = settings.backupSettings;

    if (!backupSettings || !backupSettings.enabled) {
      return;
    }

    const [hour, minute] = (backupSettings.time || '02:00').split(':');
    let cronExpression = `${minute} ${hour} * * *`; // daily by default

    if (backupSettings.frequency === 'weekly') {
      cronExpression = `${minute} ${hour} * * ${backupSettings.dayOfWeek || 0}`;
    }

    console.log(`Scheduling backup with cron: ${cronExpression}`);
    this.task = cron.schedule(cronExpression, async () => {
      try {
        await this.performBackup(backupSettings.retentionCount || 1);
      } catch (err) {
        console.error('Scheduled backup failed', err);
      }
    });
  }

  public static async performBackup(retentionCount: number, onProgress?: (progress: number) => void): Promise<string> {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }

    // Use UTC+8 for standard local time output
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}_${pad(now.getUTCHours())}-${pad(now.getUTCMinutes())}-${pad(now.getUTCSeconds())}`;
    const backupFilename = `backup-${timestamp}.zip`;
    const backupPath = path.join(this.backupsDir, backupFilename);

    // Calculate total size for progress calculation
    let totalSize = 0;
    const statSize = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
          statSize(filepath);
        } else {
          if (file === 'settings.json' || file === 'settings.json.tmp') return;
          totalSize += stat.size;
        }
      });
    };
    const dataDir = path.resolve(process.cwd(), 'data');
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    statSize(dataDir);
    statSize(uploadDir);

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      let processedBytes = 0;
      if (onProgress) {
        archive.on('data', (chunk: Buffer) => {
          processedBytes += chunk.length;
          // Compression makes processedBytes smaller than totalSize generally,
          // but we can estimate or just use archiver's progress event.
        });
        
        archive.on('progress', (progressData: any) => {
            const percent = totalSize > 0 
                ? Math.min(100, Math.round((progressData.fs.processedBytes / totalSize) * 100))
                : 100;
            onProgress(percent);
        });
      }

      output.on('close', () => {
         if (onProgress) onProgress(100);
         resolve();
      });
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      if (fs.existsSync(dataDir)) {
        const walkAndAddDecrypted = (dir: string, baseZipDir: string) => {
          fs.readdirSync(dir).forEach(file => {
            const filepath = path.join(dir, file);
            if (fs.statSync(filepath).isDirectory()) {
              walkAndAddDecrypted(filepath, `${baseZipDir}/${file}`);
            } else if (file === 'settings.json' || file === 'settings.json.tmp') {
              return; 
            } else if (file.endsWith('.json')) {
              const content = fs.readFileSync(filepath, 'utf-8');
              try {
                const decrypted = CoreStorage.decrypt(content);
                JSON.parse(decrypted); 
                archive.append(Buffer.from(decrypted, 'utf-8'), { name: `${baseZipDir}/${file}` });
              } catch (e) {
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
    });

    this.cleanupOldBackups(retentionCount);
    return backupFilename;
  }

  private static cleanupOldBackups(retentionCount: number) {
    if (retentionCount < 1) return;

    const files = fs.readdirSync(this.backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
      .map(f => ({ name: f, time: fs.statSync(path.join(this.backupsDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time); // newest first

    if (files.length > retentionCount) {
      const toDelete = files.slice(retentionCount);
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(path.join(this.backupsDir, file.name));
          console.log(`Deleted old backup ${file.name}`);
        } catch (err) {
          console.error(`Failed to delete old backup ${file.name}`, err);
        }
      });
    }
  }
}
