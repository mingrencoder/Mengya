import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { HomeData, TravelData, BookmarkData, BookmarkCategory, EpochCategory, EpochEvent } from '../../src/types';

dotenv.config();

// Ensure 32 bytes key for AES-256-CBC
const ENCRYPTION_KEY = process.env.STORAGE_ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB limit for sharding

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 核心存储类，提供基本的加密、解密和原子写入功能。
 */
export class CoreStorage {
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  static decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // 实现原子写入，防止服务中断造成的数据损坏
  static writeAtomic(filePath: string, data: any) {
    const tempPath = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    const encryptedData = this.encrypt(jsonString);
    fs.writeFileSync(tempPath, encryptedData, 'utf-8');
    fs.renameSync(tempPath, filePath); // 绝对原子性的重命名覆盖
  }

  static read(filePath: string): any {
    if (!fs.existsSync(filePath)) return null;
    try {
      const encryptedData = fs.readFileSync(filePath, 'utf-8');
      if (!encryptedData) return null;
      const decryptedString = this.decrypt(encryptedData);
      return JSON.parse(decryptedString);
    } catch(e) {
      console.error(`Failed to read/decrypt ${filePath}`, e);
      return null;
    }
  }
}

/**
 * 单例配置类，适用于 home，settings 等单独一份的数据配置。
 */
export class SingletonService<T> {
  private filePath: string;
  constructor(private name: string, private defaultData: T) {
    this.filePath = path.resolve(process.cwd(), `data/${name}.json`);
    this.init();
  }

  init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      this.write(this.defaultData);
      console.log(`Created default encrypted file for ${this.name}`);
    }
  }

  read(): T {
    const data = CoreStorage.read(this.filePath);
    return data || this.defaultData;
  }

  write(data: T) {
    CoreStorage.writeAtomic(this.filePath, data);
  }
}

/**
 * 列表管理类，支持 Sharding 机制（分片）。
 */
export class CollectionService<T extends { id: string }> {
  private dirPath: string;
  constructor(private name: string) {
    this.dirPath = path.resolve(process.cwd(), `data/${name}`);
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }

  // 获得所有有序的分片文件
  private getChunks(): string[] {
    if (!fs.existsSync(this.dirPath)) return [];
    return fs.readdirSync(this.dirPath)
      .filter(f => f.startsWith('chunk_') && f.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('chunk_', '').replace('.json', ''), 10);
        const numB = parseInt(b.replace('chunk_', '').replace('.json', ''), 10);
        return numA - numB;
      });
  }

  public readAll(): T[] {
    const chunks = this.getChunks();
    let allData: T[] = [];
    for (const chunk of chunks) {
      const filePath = path.join(this.dirPath, chunk);
      const data = CoreStorage.read(filePath);
      if (Array.isArray(data)) {
        allData = allData.concat(data);
      }
    }
    return allData;
  }

  public add(item: T) {
    const chunks = this.getChunks();
    let targetChunk = chunks.length > 0 ? chunks[chunks.length - 1] : null;
    let targetPath = targetChunk ? path.join(this.dirPath, targetChunk) : null;
    
    let chunkData: T[] = [];
    if (targetPath && fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      // 当超出 5MB 阈值，开辟新 chunk 分片
      if (stat.size >= MAX_CHUNK_SIZE) {
        const nextNum = parseInt(targetChunk!.replace('chunk_', ''), 10) + 1;
        targetChunk = `chunk_${nextNum}.json`;
        targetPath = path.join(this.dirPath, targetChunk);
      } else {
        chunkData = CoreStorage.read(targetPath) || [];
      }
    } else {
      targetChunk = 'chunk_1.json';
      targetPath = path.join(this.dirPath, targetChunk);
    }

    chunkData.push(item);
    CoreStorage.writeAtomic(targetPath!, chunkData);
  }

  public update(id: string, partial: Partial<T>): T | null {
    const chunks = this.getChunks();
    for (const chunk of chunks) {
      const filePath = path.join(this.dirPath, chunk);
      const chunkData = CoreStorage.read(filePath) as T[];
      if (!chunkData) continue;
      
      const index = chunkData.findIndex(i => i.id === id);
      if (index !== -1) {
        chunkData[index] = { ...chunkData[index], ...partial };
        CoreStorage.writeAtomic(filePath, chunkData); // 仅原子重新写入包含该 id 的分片
        return chunkData[index];
      }
    }
    return null;
  }

  public delete(id: string): T | null {
    const chunks = this.getChunks();
    for (const chunk of chunks) {
      const filePath = path.join(this.dirPath, chunk);
      const chunkData = CoreStorage.read(filePath) as T[];
      if (!chunkData) continue;
      
      const index = chunkData.findIndex(i => i.id === id);
      if (index !== -1) {
        const [deleted] = chunkData.splice(index, 1);
        CoreStorage.writeAtomic(filePath, chunkData);
        return deleted; // 返回已删除数据做后续清理
      }
    }
    return null;
  }

  public writeAll(items: T[]) {
    const chunks = this.getChunks();
    for (const chunk of chunks) {
      fs.unlinkSync(path.join(this.dirPath, chunk));
    }

    let currentChunkNum = 1;
    let currentChunkData: T[] = [];

    for (let i = 0; i < items.length; i++) {
      currentChunkData.push(items[i]);
      const estimatedSize = Buffer.byteLength(JSON.stringify(currentChunkData), 'utf-8');
      if (estimatedSize > (MAX_CHUNK_SIZE / 2) && i !== items.length - 1) {
        const filePath = path.join(this.dirPath, `chunk_${currentChunkNum}.json`);
        CoreStorage.writeAtomic(filePath, currentChunkData);
        currentChunkNum++;
        currentChunkData = [];
      }
    }

    if (currentChunkData.length > 0) {
      const filePath = path.join(this.dirPath, `chunk_${currentChunkNum}.json`);
      CoreStorage.writeAtomic(filePath, currentChunkData);
    }
  }
}

export const services = {
  home: new SingletonService<HomeData>('home', {
    title: "萌芽 - 记录生活与灵感",
    description: "欢迎来到我的个人网络空间。",
    welcomeMessage: "你好，生活记录者！"
  }),
  settings: new SingletonService<{passwordHash: string, travelPasswordHash?: string, backupSettings?: any}>('settings', {
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'supersecretpassword'),
    travelPasswordHash: hashPassword('123321'),
    backupSettings: {
      enabled: false,
      frequency: 'daily',
      daysOfWeek: [1],
      time: '02:00',
      retentionCount: 1
    }
  }),
  travels: new CollectionService<TravelData>('travels'),
  bookmarks: new CollectionService<BookmarkData>('bookmarks'),
  bookmarkCategories: new CollectionService<BookmarkCategory>('bookmarkCategories'),
  epochCategories: new CollectionService<EpochCategory>('epochCategories'),
  epochEvents: new CollectionService<EpochEvent>('epochEvents')
};

// Initialize default epoch categories if none exist
if (services.epochCategories.readAll().length === 0) {
  services.epochCategories.add({ id: 'life', name: '里程碑', color: '#6366f1' });
  services.epochCategories.add({ id: 'travel', name: '家庭旅行', color: '#fbbf24' });
}

// Initialize default bookmark categories if none exist
if (services.bookmarkCategories.readAll().length === 0) {
  services.bookmarkCategories.add({ id: 'general', name: '常用' });
  services.bookmarkCategories.add({ id: 'tools', name: '工具' });
  services.bookmarkCategories.add({ id: 'inspiration', name: '灵感' });
}
