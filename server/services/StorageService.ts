import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Ensure 32 bytes key for AES-256-CBC
const ENCRYPTION_KEY = process.env.STORAGE_ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

export interface PlatformData {
  home: {
    title: string;
    description: string;
    welcomeMessage: string;
    avatarUrl?: string;
  };
  travels: Array<{
    id: string;
    location: string;
    title: string;
    date: string;
    imageUrl?: string;
    imageUrls?: string[];
    coverImageIndex?: number;
    description?: string;
  }>;
  bookmarks: Array<{
    id: string;
    title: string;
    url: string;
    description: string;
    category?: string;
  }>;
  settings?: {
    passwordHash: string;
  };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DEFAULT_DATA: PlatformData = {
  home: {
    title: "萌芽 - 记录生活与灵感",
    description: "欢迎来到我的个人网络空间。基于无数据库架构，带来极简、安全、本地化的体验。",
    welcomeMessage: "你好，生活记录者！"
  },
  travels: [],
  bookmarks: [],
  settings: {
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'supersecretpassword')
  }
};

export class StorageService {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  // Ensure directory exists
  public init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // If file doesn't exist, create it with default data
    if (!fs.existsSync(this.filePath)) {
      this.write(DEFAULT_DATA);
      console.log('Created default encrypted storage file.');
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  public read(): PlatformData {
    try {
      if (!fs.existsSync(this.filePath)) {
        return DEFAULT_DATA;
      }
      const encryptedData = fs.readFileSync(this.filePath, 'utf-8');
      if (!encryptedData) {
        return DEFAULT_DATA;
      }
      const decryptedString = this.decrypt(encryptedData);
      return JSON.parse(decryptedString) as PlatformData;
    } catch (error) {
      console.error('Failed to read and decrypt data:', error);
      return DEFAULT_DATA; // Return default if corrupted or failed
    }
  }

  public write(data: PlatformData): void {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const encryptedData = this.encrypt(jsonString);
      fs.writeFileSync(this.filePath, encryptedData, 'utf-8');
    } catch (error) {
      console.error('Failed to encrypt and write data:', error);
      throw new Error('Data storage write failed');
    }
  }
}
