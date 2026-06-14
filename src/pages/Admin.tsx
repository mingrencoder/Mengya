import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { Lock, LogOut, Plus, Upload, Loader2, Trash2, X, Search, Filter, Calendar, MapPin, GripVertical, CheckCircle, XCircle, Home, Map, Bookmark, Settings, Eye, EyeOff, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CustomBlock, HomeData } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

// --- Message Modal Component ---
export function MessageModal({ isOpen, isError, message, onClose }: { isOpen: boolean; isError: boolean; message: string; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {isError ? (
                <XCircle className="w-16 h-16 text-red-500" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
              <h3 className="text-xl font-bold dark:text-white pb-2">{isError ? '操作失败' : '操作成功'}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
              <button 
                onClick={onClose}
                className="mt-4 bg-indigo-500 text-white px-8 py-2 rounded-full font-medium hover:bg-indigo-600 transition-colors"
              >
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Admin() {
  const [token, setToken] = useState<string | null>(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      try {
        const base64Url = adminToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        if (payload.exp * 1000 > Date.now()) return adminToken;
      } catch (e) {}
      localStorage.removeItem('admin_token');
    }
    return null;
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'travels' | 'bookmarks' | 'settings'>(
    (localStorage.getItem('admin_active_tab') as any) || 'home'
  );

  const { data, refresh } = useData();

  useEffect(() => {
    if (token && data && data.isTravelAuthorized === false) {
      handleLogout();
    }
  }, [token, data]);

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const resData = await res.json();
        localStorage.setItem('admin_token', resData.token);
        await refresh();
        setToken(resData.token);
      } else {
        setError('密码错误');
      }
    } catch {
      setError('发生错误');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-3xl w-full max-w-sm space-y-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-slate-900 dark:text-white/70" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">管理员访问</h2>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-1">请输入密码以管理内容</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-slate-200/50 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              登录
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-2 flex flex-col">
          <div className="mb-6 px-2">
            <h1 className='text-3xl font-bold text-slate-900 dark:text-white tracking-tight'>控制台</h1>
            <p className='text-slate-600 dark:text-slate-400 mt-1 text-sm'>管理您的系统模块</p>
          </div>
          
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
             <button
                onClick={() => setActiveTab('home')}
                className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                   activeTab === 'home' 
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
                )}
             >
                <Home className="w-5 h-5" /> 首页设置
             </button>
             <button
                onClick={() => setActiveTab('travels')}
                className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                   activeTab === 'travels' 
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
                )}
             >
                <Map className="w-5 h-5" /> 旅行记录
             </button>
             <button
                onClick={() => setActiveTab('bookmarks')}
                className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                   activeTab === 'bookmarks' 
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
                )}
             >
                <Bookmark className="w-5 h-5" /> 书签管理
             </button>
             <button
                onClick={() => setActiveTab('settings')}
                className={cn(
                   "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap",
                   activeTab === 'settings' 
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
                )}
             >
                <Settings className="w-5 h-5" /> 系统设置
             </button>
          </nav>
          
          <div className="mt-auto pt-6 lg:pt-12 px-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-sm hover:bg-slate-300 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-white w-full justify-center"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
           {activeTab === 'home' && (
             <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="w-full max-w-4xl">
               <HomeEditor token={token} />
             </motion.div>
           )}
           {activeTab === 'travels' && (
             <motion.div key="travels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
               <TravelAdder token={token} />
             </motion.div>
           )}
           {activeTab === 'bookmarks' && (
             <motion.div key="bookmarks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
               <BookmarkAdder token={token} />
             </motion.div>
           )}
           {activeTab === 'settings' && (
             <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-8 w-full max-w-xl">
               <PasswordEditor token={token} />
               <DataExportImport token={token} />
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackupListModal({ isOpen, onClose, token, onRestore }: { isOpen: boolean; onClose: () => void; token: string, onRestore?: (filename: string) => void }) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBackups(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filename: string) => {
    window.location.href = `/api/data/backup/download/${filename}?token=${token}`;
  };

  const handleDelete = async (filename: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/data/backup/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">本地备份列表</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500">暂无备份记录</div>
              ) : (
                backups.map(b => (
                  <div key={b.filename} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-[240px]">{b.filename}</span>
                      <span className="text-xs text-slate-500">{new Date(b.time).toLocaleString()} - {(b.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {onRestore && (
                        <button
                          onClick={() => setRestoreConfirm(b.filename)}
                          className="px-4 py-1.5 shrink-0 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                          还原
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(b.filename)}
                        className="px-4 py-1.5 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                      >
                        下载
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(b.filename)}
                        disabled={deleting && deleteConfirm === b.filename}
                        className="p-1.5 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="删除备份"
                      >
                        {deleting && deleteConfirm === b.filename ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <ConfirmModal
            isOpen={restoreConfirm !== null}
            title="确认还原"
            message={`确定要将存档还原为此版本 (${restoreConfirm}) 吗？此操作将覆盖现有数据，且不可逆。`}
            confirmText="确认还原"
            type="warning"
            onConfirm={() => {
              if (restoreConfirm && onRestore) {
                onRestore(restoreConfirm);
              }
              setRestoreConfirm(null);
            }}
            onCancel={() => setRestoreConfirm(null)}
          />

          <ConfirmModal
            isOpen={deleteConfirm !== null}
            title="删除备份文件"
            message={`确定要删除此备份 (${deleteConfirm}) 吗？此操作将永久删除该文件，且不可恢复。`}
            confirmText="确认删除"
            type="danger"
            onConfirm={() => {
              if (deleteConfirm) {
                handleDelete(deleteConfirm);
              }
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DataExportImport({ token }: { token: string }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [exportProgress, setExportProgress] = useState('');
  const [backupProgress, setBackupProgress] = useState('');
  const [backupListOpen, setBackupListOpen] = useState(false);

  const { refresh, data } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  // Conflict Resolution States
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{tempDirId: string, localOnlyCount: number} | null>(null);

  // Backup Settings Form State
  const [backupSettings, setBackupSettings] = useState(() => data?.backupSettings || { enabled: false, frequency: 'daily', dayOfWeek: 1, time: '02:00', retentionCount: 1 });
  const [savingBackup, setSavingBackup] = useState(false);
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  const showMessage = (msg: string, isErr: boolean = false, cb?: () => void) => {
    setModalMessage(msg);
    setModalIsError(isErr);
    if (cb) setModalCallback(() => cb);
    else setModalCallback(null);
    setModalOpen(true);
  };

  const executeConflictResolution = async (strategy: 'merge' | 'replace') => {
    if (!conflictData) return;
    setImporting(true);
    setImportProgress('处理中...');
    setConflictModalOpen(false);
    try {
      const res = await fetch('/api/data/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tempDirId: conflictData.tempDirId, strategy })
      });
      if (res.ok) {
        await refresh();
        showMessage('导入成功！数据已更新', false);
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage(err.error || '执行导入失败', true);
      }
    } catch {
      showMessage('执行导入时发生错误', true);
    } finally {
      setImporting(false);
      setImportProgress('');
      setConflictData(null);
    }
  };

  const cancelConflictResolution = async () => {
    if (!conflictData) return;
    setConflictModalOpen(false);
    try {
      await fetch('/api/data/import/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tempDirId: conflictData.tempDirId })
      });
    } catch {}
    setConflictData(null);
    showMessage('导入已取消', false);
  };

  const handleExport = async () => { /* ... existing handleExport ... */
    setExporting(true);
    setExportProgress('0%');
    try {
      const res = await fetch('/api/data/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        let blob: Blob;
        if (res.body) {
          const reader = res.body.getReader();
          const contentLength = res.headers.get('Content-Length');
          const uncompressedTotal = res.headers.get('X-Total-Size');
          const total = contentLength ? parseInt(contentLength, 10) : (uncompressedTotal ? parseInt(uncompressedTotal, 10) : 0);
          
          let received = 0;
          const chunks: Uint8Array[] = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              if (total) {
                let percent = Math.round((received / total) * 100);
                if (percent > 99) percent = 99;
                setExportProgress(`${percent}%`);
              } else {
                setExportProgress(`${(received / 1024 / 1024).toFixed(1)} MB`);
              }
            }
          }
          blob = new Blob(chunks, { type: 'application/zip' });
        } else {
          blob = await res.blob();
        }

        let filename = 'export.zip';
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.includes('filename=')) {
          const matches = disposition.match(/filename="?([^";]+)"?/);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage('导出成功', false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showMessage(errData.error || '导出失败', true);
      }
    } catch {
      showMessage('发生错误，或网络连接失败', true);
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress('0%');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/data/import/analyze');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setImportProgress(`${Math.round((event.loaded / event.total) * 100)}%`);
          } else {
            setImportProgress(`${(event.loaded / 1024 / 1024).toFixed(1)} MB`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ status: 'success' });
            }
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error(res.error || '导入分析失败'));
            } catch {
              reject(new Error('导入分析失败'));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.send(formData);
      });
      
      if (result.status === 'conflict') {
        setConflictData({ tempDirId: result.tempDirId, localOnlyCount: result.localOnlyCount });
        setConflictModalOpen(true);
        // We do not set Importing to false here, so the loader remains hidden until resolution
      } else {
        await refresh();
        showMessage('导入成功！数据已更新', false);
      }
    } catch (err: any) {
      showMessage(err.message || '发生错误', true);
    } finally {
      // In case of conflict, we keep uploading state? No, we shouldn't show upload spinner during conflict dialog.
      // So we can set it to false here.
      setImporting(false);
      setImportProgress('');
      e.target.value = '';
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setBackupListOpen(false); // Close the modal
    setImporting(true);
    setImportProgress('还原中...');

    try {
      const res = await fetch('/api/data/import/analyze_backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '还原失败');
      }

      const result = await res.json();
      if (result.status === 'conflict') {
        setConflictData({ tempDirId: result.tempDirId, localOnlyCount: result.localOnlyCount });
        setConflictModalOpen(true);
      } else {
        await refresh();
        showMessage('还原成功！数据已更新', false);
      }
    } catch (err: any) {
      showMessage(err.message || '发生错误', true);
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  const handleSaveBackupSettings = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setSavingBackup(true);
    try {
      const res = await fetch('/api/data/backup/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(backupSettings)
      });
      if (res.ok) {
        showMessage('备份设置保存成功', false);
        await refresh();
      } else {
        showMessage('配置保存失败', true);
      }
    } catch {
      showMessage('网络错误', true);
    } finally {
      setSavingBackup(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    setBackupProgress('0%');
    try {
      const res = await fetch('/api/data/backup/trigger', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'progress') {
                    setBackupProgress(`${data.progress}%`);
                  } else if (data.type === 'complete') {
                    showMessage(`备份成功！文件已保存至: backups/${data.filename}`, false);
                    done = true;
                  } else if (data.type === 'error') {
                    showMessage(data.message || '备份执行失败', true);
                    done = true;
                  }
                } catch (e) {
                  // ignore parse error
                }
              }
            }
          }
        }
      } else {
        showMessage('备份执行失败', true);
      }
    } catch {
      showMessage('网络错误', true);
    } finally {
      setTriggeringBackup(false);
      setBackupProgress('');
    }
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-8 flex-1 h-fit">
      <div>
        <h2 className="text-xl font-medium">数据导出与恢复</h2>
        <p className="text-sm text-slate-600 dark:text-white/50 mt-2 mb-4">将您的所有数据及上传的照片打包为 ZIP 文件下载到本地，或从 ZIP 文件恢复您的数据及照片。</p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || importing}
            className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在导出 {exportProgress}</span>
              </>
            ) : '下载数据包 (ZIP)'}
          </button>
          
          <label className={cn(
            "px-6 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer",
            (importing || exporting) && "opacity-50 pointer-events-none"
          )}>
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在导入 {importProgress}</span>
              </>
            ) : '导入数据包 (ZIP)'}
            <input type="file" accept=".zip" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-white/10">
        <h2 className="text-xl font-medium">服务器自动备份</h2>
        <p className="text-sm text-slate-600 dark:text-white/50 mt-2 mb-4">开启自动备份后，系统会定时将数据打包备份至服务器根目录的 backups 文件夹下。</p>
        
        <form onSubmit={handleSaveBackupSettings} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="enableBackup"
                checked={backupSettings.enabled}
                onChange={(e) => setBackupSettings({ ...backupSettings, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-black/20 border-white/10"
              />
              <label htmlFor="enableBackup" className="text-sm cursor-pointer select-none">启用定时备份</label>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs text-slate-500 dark:text-white/50 shrink-0">保留最近备份份数</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={backupSettings.retentionCount}
                  onChange={(e) => setBackupSettings({ ...backupSettings, retentionCount: parseInt(e.target.value) || 1 })}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveBackupSettings}
                  disabled={savingBackup}
                  className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                >
                  保存
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {backupSettings.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 px-1">备份频率</label>
                    <select
                      value={backupSettings.frequency}
                      onChange={(e) => setBackupSettings({ ...backupSettings, frequency: e.target.value as 'daily' | 'weekly' })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm text-slate-700 dark:text-white"
                    >
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                    </select>
                  </div>

                  {backupSettings.frequency === 'weekly' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 px-1">周几备份</label>
                      <select
                        value={backupSettings.dayOfWeek}
                        onChange={(e) => setBackupSettings({ ...backupSettings, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm text-slate-700 dark:text-white"
                      >
                        <option value="1">周一</option>
                        <option value="2">周二</option>
                        <option value="3">周三</option>
                        <option value="4">周四</option>
                        <option value="5">周五</option>
                        <option value="6">周六</option>
                        <option value="0">周日</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 px-1">执行时间</label>
                    <input
                      type="time"
                      value={backupSettings.time}
                      onChange={(e) => setBackupSettings({ ...backupSettings, time: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={savingBackup}
              className="w-full sm:w-auto bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              {savingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存定时设置'}
            </button>

            <button
              type="button"
              onClick={handleTriggerBackup}
              disabled={triggeringBackup}
              className="w-full sm:w-auto bg-indigo-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {triggeringBackup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>备份中 {backupProgress}</span>
                </>
              ) : '立即执行备份'}
            </button>

            <button
              type="button"
              onClick={() => setBackupListOpen(true)}
              className="w-full sm:w-auto border border-indigo-500 text-indigo-500 hover:bg-indigo-500 hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center"
            >
              查看本地备份
            </button>
          </div>
        </form>
      </div>

      <BackupListModal isOpen={backupListOpen} onClose={() => setBackupListOpen(false)} token={token} onRestore={handleRestoreBackup} />

      <MessageModal 
        isOpen={modalOpen} 
        isError={modalIsError} 
        message={modalMessage} 
        onClose={() => {
          setModalOpen(false);
          if (modalCallback) modalCallback();
        }} 
      />

      {createPortal(
        <AnimatePresence>
          {conflictModalOpen && conflictData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cancelConflictResolution}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col text-center space-y-4">
                  <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white pb-2">发现冲突数据</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    发现本地有 <strong className="text-indigo-500">{conflictData.localOnlyCount}</strong> 条记录不在导入包中。您希望如何处理？
                  </p>
                  <div className="flex flex-col gap-3 mt-4">
                    <button onClick={() => executeConflictResolution('merge')} className="bg-indigo-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors text-sm">
                      合并保留 (推荐)
                    </button>
                    <button onClick={() => executeConflictResolution('replace')} className="bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white px-4 py-3 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm">
                      仅保留导入数据 
                    </button>
                    <button onClick={cancelConflictResolution} className="mt-2 text-slate-500 hover:text-slate-700 dark:hover:text-white/80 transition-colors text-sm font-medium">
                      取消导入
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}

function PasswordEditor({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [travelPassword, setTravelPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showTravelPassword, setShowTravelPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const bodyPayload: any = {};
      if (newPassword) bodyPayload.newPassword = newPassword;
      if (travelPassword) bodyPayload.travelPassword = travelPassword;

      if (Object.keys(bodyPayload).length === 0) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bodyPayload)
      });
      
      if (res.ok) {
        setMessage('密码修改成功');
        setNewPassword('');
        setTravelPassword('');
      } else {
        setMessage('密码修改失败');
      }
    } catch {
      setMessage('发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 flex-1 h-fit">
      <h2 className="text-xl font-medium">修改密码</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">新管理员后台密码（留空则不修改）</label>
          <div className="relative">
            <input
              type={showAdminPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新后台密码"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            >
              {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">新旅行日记密码（留空则不修改，默认: 123321）</label>
          <div className="relative">
            <input
              type={showTravelPassword ? "text" : "password"}
              value={travelPassword}
              onChange={(e) => setTravelPassword(e.target.value)}
              placeholder="请输入新旅行日记密码"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowTravelPassword(!showTravelPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            >
              {showTravelPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {message && <p className={cn("text-xs", message.includes('成功') ? "text-emerald-400" : "text-red-400")}>{message}</p>}
        <button
          type="submit"
          disabled={loading || (!newPassword && !travelPassword)}
          className="bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存修改'}
        </button>
      </form>
    </section>
  );
}

function HomeEditor({ token }: { token: string }) {
  const { data, updateHomeConfig } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<HomeData>(data ? data.home : { title: '', description: '', welcomeMessage: '', customBlocks: [] });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Message Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const showMessage = (msg: string, isErr: boolean = false, cb?: () => void) => {
    setModalMessage(msg);
    setModalIsError(isErr);
    if (cb) setModalCallback(() => cb);
    else setModalCallback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = form.avatarUrl;

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await fetch('/api/upload/common', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!uploadRes.ok) {
          throw new Error('头像上传失败，可能是登录已过期');
        }
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.url;
      }

      const success = await updateHomeConfig({ ...form, avatarUrl });
      if (!success) {
        throw new Error('配置更新失败，请重试或刷新登录');
      }
      
      showMessage('首页设置保存成功', false, () => {
        setAvatarFile(null);
      });
    } catch (err: any) {
      showMessage(err.message || '发生错误', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBlockImage = async (index: number, file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const uploadRes = await fetch('/api/upload/common', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) {
        throw new Error('上传失败，可能是登录已过期');
      }
      const uploadData = await uploadRes.json();
      updateBlock(index, { url: uploadData.url });
    } catch {
      showMessage('上传发生错误', true);
    }
  };

  const addBlock = () => {
    const newBlock: CustomBlock = { id: Date.now().toString(), type: 'text', title: '', content: '' };
    setForm({ ...form, customBlocks: [...(form.customBlocks || []), newBlock] });
  };

  const updateBlock = (index: number, updates: Partial<CustomBlock>) => {
    const newBlocks = [...(form.customBlocks || [])];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setForm({ ...form, customBlocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    setDeleteConfirm(index);
  };
  
  const confirmRemoveBlock = () => {
    if (deleteConfirm === null) return;
    const newBlocks = [...(form.customBlocks || [])];
    newBlocks.splice(deleteConfirm, 1);
    setForm({ ...form, customBlocks: newBlocks });
    setDeleteConfirm(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;

    const newBlocks = [...(form.customBlocks || [])];
    const [movedBlock] = newBlocks.splice(sourceIndex, 1);
    newBlocks.splice(targetIndex, 0, movedBlock);
    setForm({ ...form, customBlocks: newBlocks });
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 flex-1 h-fit">
      <h2 className="text-xl font-medium">首页设置</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {avatarFile ? (
              <img src={URL.createObjectURL(avatarFile)} alt="preview" className="w-full h-full object-cover" />
            ) : form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-5 h-5 text-slate-500 dark:text-white/40" />
            )}
          </div>
          <div>
            <label className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-white/10 transition-colors inline-block">
              更换头像
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">网站标题</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">网站描述</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">欢迎语</label>
          <input
            value={form.welcomeMessage}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">自定义扩展区块</label>
            <button type="button" onClick={addBlock} className="text-xs bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> 添加区块
            </button>
          </div>
          
          <div className="space-y-4">
            {form.customBlocks?.map((block, i) => (
              <div 
                key={block.id || i} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                className="bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3 relative group"
              >
                <div className="absolute top-3 right-10 cursor-move text-slate-400 dark:text-white/30 hover:text-white transition-colors" title="拖动排序">
                  <GripVertical className="w-4 h-4" />
                </div>
                <button type="button" onClick={() => removeBlock(i)} className="absolute top-3 right-3 text-slate-400 dark:text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex gap-4">
                  <select
                    value={block.type}
                    onChange={(e) => updateBlock(i, { type: e.target.value as 'text' | 'image' })}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-slate-700 dark:text-white/80"
                  >
                    <option value="text">文案卡片</option>
                    <option value="image">图片卡片</option>
                  </select>
                </div>
                
                <input
                  placeholder="区块标题 (可选)"
                  value={block.title || ''}
                  onChange={(e) => updateBlock(i, { title: e.target.value })}
                  className="w-full bg-transparent border-b border-white/10 pb-2 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                
                {block.type === 'text' ? (
                  <textarea
                    placeholder="区块内容..."
                    value={block.content || ''}
                    onChange={(e) => updateBlock(i, { content: e.target.value })}
                    rows={2}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors resize-none mt-2"
                  />
                ) : (
                  <div className="mt-2 space-y-2 relative">
                    <div className="flex items-center gap-4">
                      {block.url && (
                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0 overflow-hidden relative group/img">
                          <img src={block.url} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer hover:bg-white/10 transition-colors inline-block text-slate-700 dark:text-white/80">
                        {block.url ? '重新上传' : '上传文件'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadBlockImage(i, e.target.files?.[0] || null)} />
                      </label>
                      {block.url && (
                        <button type="button" onClick={() => updateBlock(i, { url: '' })} className="text-xs text-red-500 hover:text-red-400 transition-colors border border-red-500/30 bg-red-500/10 px-2 py-1 rounded">
                          删除照片
                        </button>
                      )}
                    </div>
                    <input
                      placeholder="或输入图片链接 URL"
                      value={block.url || ''}
                      onChange={(e) => updateBlock(i, { url: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors mt-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存设置'}
        </button>
      </form>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="删除区块"
        message="确定要删除这个自定义扩展区块吗？此操作不可逆。"
        onConfirm={confirmRemoveBlock}
        onCancel={() => setDeleteConfirm(null)}
      />

      <MessageModal 
        isOpen={modalOpen} 
        isError={modalIsError} 
        message={modalMessage} 
        onClose={() => {
          setModalOpen(false);
          if (modalCallback) modalCallback();
        }} 
      />
    </section>
  );
}

function TravelAdder({ token }: { token: string }) {
  const { data, addTravel, updateTravel, deleteTravel } = useData();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', location: '', date: '', description: '', externalLink: '', externalLinkText: '', coverImageIndex: 0, tagsStr: '', bookmarked: false });
  const [files, setFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Message Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const showMessage = (msg: string, isErr: boolean = false, cb?: () => void) => {
    setModalMessage(msg);
    setModalIsError(isErr);
    if (cb) setModalCallback(() => cb);
    else setModalCallback(null);
    setModalOpen(true);
  };
  
  // Batch edit state
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [batchTagsStr, setBatchTagsStr] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Extract filter options
  const filterOptions = React.useMemo(() => {
    if (!data?.travels) return { years: [], months: [], locations: [], tags: [] };
    
    const years = new Set<string>();
    const months = new Set<string>();
    const locations = new Set<string>();
    const tags = new Set<string>();

    data.travels.forEach(t => {
      if (t.location) locations.add(t.location);
      if (t.tags) t.tags.forEach(tag => tags.add(tag));
      
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear().toString();
        years.add(y);
        if (!selectedYear || selectedYear === y) {
          months.add((d.getMonth() + 1).toString().padStart(2, '0'));
        }
      }
    });

    return {
      years: Array.from(years).sort().reverse(),
      months: Array.from(months).sort(),
      locations: Array.from(locations).sort(),
      tags: Array.from(tags).sort()
    };
  }, [data?.travels, selectedYear]);

  const handleYearChange = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedMonth(null);
    }
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredTravels = React.useMemo(() => {
    if (!data?.travels) return [];
    
    return data.travels.filter(t => {
      const matchesSearch = searchQuery 
        ? t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      let matchesYear = true;
      let matchesMonth = true;
      if (selectedYear || selectedMonth) {
        const d = new Date(t.date);
        const isValidDate = !isNaN(d.getTime());
        if (isValidDate) {
          if (selectedYear) matchesYear = d.getFullYear().toString() === selectedYear;
          if (selectedMonth) matchesMonth = (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
        } else {
          matchesYear = false; 
          matchesMonth = false;
        }
      }

      if (startDate && t.date < startDate) matchesYear = false;
      if (endDate && t.date > endDate) matchesYear = false;

      const matchesLocation = selectedLocations.length > 0 
        ? selectedLocations.includes(t.location)
        : true;

      const matchesTags = selectedTags.length > 0
        ? selectedTags.every(tag => t.tags?.includes(tag))
        : true;

      const matchesBookmarked = showBookmarkedOnly ? t.bookmarked === true : true;

      return matchesSearch && matchesYear && matchesMonth && matchesLocation && matchesTags && matchesBookmarked;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data?.travels, searchQuery, selectedYear, selectedMonth, startDate, endDate, selectedLocations, selectedTags, showBookmarkedOnly]);

  const startEdit = (travel: any) => {
    setEditingId(travel.id);
    setForm({
      title: travel.title || '',
      location: travel.location || '',
      date: travel.date || '',
      description: travel.description || '',
      externalLink: travel.externalLink || '',
      externalLinkText: travel.externalLinkText || '',
      coverImageIndex: travel.coverImageIndex || 0,
      tagsStr: travel.tags ? travel.tags.join(', ') : '',
      bookmarked: travel.bookmarked || false,
    });
    setFiles([]);
    setExistingImageUrls(travel.imageUrls || (travel.imageUrl ? [travel.imageUrl] : []));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', location: '', date: '', description: '', externalLink: '', externalLinkText: '', coverImageIndex: 0, tagsStr: '', bookmarked: false });
    setFiles([]);
    setExistingImageUrls([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    const totalCount = existingImageUrls.length + newFiles.length;
    if (form.coverImageIndex >= totalCount) {
      setForm({ ...form, coverImageIndex: Math.max(0, totalCount - 1) });
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    const urls = [...existingImageUrls];
    urls.splice(index, 1);
    setExistingImageUrls(urls);
    const totalCount = urls.length + files.length;
    if (form.coverImageIndex >= totalCount) {
      setForm({ ...form, coverImageIndex: Math.max(0, totalCount - 1) });
    }
  };

  // Tag Edit State
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagVal, setNewTagVal] = useState('');
  const [tagLoading, setTagLoading] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  // Location Edit State
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [newLocationVal, setNewLocationVal] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);

  const confirmDeleteTravel = async () => {
    if (!deleteConfirm) return;
    try {
      const success = await deleteTravel(deleteConfirm);
      if (!success) {
        throw new Error('删除失败，请刷新登录');
      }
      showMessage('旅行记录已删除', false, () => {
        if (editingId === deleteConfirm) {
          cancelEdit();
        }
        window.location.reload();
      });
    } catch (e: any) {
      showMessage(e.message || '删除失败', true);
    }
    setDeleteConfirm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await fetch('/api/upload/travels', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!uploadRes.ok) throw new Error('上传失败，可能是登录已过期');
        const uploadData = await uploadRes.json();
        newUrls.push(uploadData.url);
      }

      const finalUrls = [...existingImageUrls, ...newUrls];
      
      const payload = {
        title: form.title,
        location: form.location,
        date: form.date,
        description: form.description,
        externalLink: form.externalLink,
        externalLinkText: form.externalLinkText,
        coverImageIndex: form.coverImageIndex,
        tags: form.tagsStr.split(',').map(s => s.trim()).filter(Boolean),
        bookmarked: form.bookmarked,
        imageUrls: finalUrls,
        imageUrl: finalUrls[form.coverImageIndex] || finalUrls[0] || undefined // for backward compat
      };

      if (editingId && updateTravel) {
        const success = await updateTravel(editingId, payload);
        if (!success) throw new Error('更新失败，请刷新登录');
        showMessage('旅行记录更新成功', false, () => {
          cancelEdit();
          window.location.reload();
        });
      } else {
        const success = await addTravel(payload);
        if (!success) throw new Error('添加失败，请刷新登录');
        showMessage('旅行记录添加成功', false, () => {
          cancelEdit();
          window.location.reload();
        });
      }
    } catch (e: any) {
      showMessage(e.message || '失败', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
      <h2 className="text-xl font-medium">{editingId ? '编辑旅行记录' : '旅行记录管理'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            placeholder="标题 (如：夏日冲绳)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
          <input
            required
            placeholder="地点 (如：日本·冲绳)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            required
            type="date"
            placeholder="日期"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm color-scheme-dark"
            style={{ colorScheme: 'dark' }}
          />
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              // Adjust for local timezone
              const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              setForm({ ...form, date: localDate });
            }}
            className="px-4 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
          >
            今天
          </button>
        </div>
        <textarea
          placeholder="描述（选填）"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="输入外链地址，例如 https://..."
            value={form.externalLink}
            onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
          <input
            placeholder="按钮显示文字，选填，默认为&quot;查看详情&quot;"
            value={form.externalLinkText}
            onChange={(e) => setForm({ ...form, externalLinkText: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <input
            placeholder="标签 (逗号分隔，如：海岛, 潜水)"
            value={form.tagsStr}
            onChange={(e) => setForm({ ...form, tagsStr: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
          <label className="flex items-center gap-2 cursor-pointer bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm w-fit">
            <input 
              type="checkbox" 
              checked={form.bookmarked} 
              onChange={(e) => setForm({ ...form, bookmarked: e.target.checked })}
              className="rounded w-4 h-4 bg-black/20 border-white/20 text-indigo-500 focus:ring-indigo-500/50 transition-colors"
            />
            <span className="text-white/70">设为收藏记录</span>
          </label>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-white/50 px-1">照片库 (支持多张，可选且可不传)</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-white"
            >
              <Upload className="w-4 h-4" /> 选择照片上传 ({files.length > 0 ? `已选 ${files.length} 张` : '未选择'})
            </label>
          </div>
        </div>

        {(existingImageUrls.length > 0 || files.length > 0) && (
          <div className="space-y-2">
             <label className="text-xs text-white/50 px-1">选择首页展示图片 (点击图片设置为封面)</label>
             <div className="flex gap-2 overflow-x-auto pb-2">
               {existingImageUrls.map((url, i) => (
                 <div key={i} onClick={() => setForm({...form, coverImageIndex: i})} className={cn("relative w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2", form.coverImageIndex === i ? "border-indigo-500" : "border-transparent")}>
                   <img src={url} className="w-full h-full object-cover" />
                   <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(i); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                 </div>
               ))}
               {files.map((file, i) => (
                 <div key={`new-${i}`} onClick={() => setForm({...form, coverImageIndex: existingImageUrls.length + i})} className={cn("relative w-20 h-20 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2", form.coverImageIndex === existingImageUrls.length + i ? "border-indigo-500" : "border-transparent")}>
                   <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70" />
                   <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(i); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="flex gap-2">
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-3 rounded-xl text-sm font-medium bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors text-slate-800 dark:text-white"
            >
              取消编辑
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-white text-black px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> {editingId ? '保存记录' : '添加记录'}</>}
          </button>
        </div>
      </form>
      
      {data?.travels && data.travels.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/70">已有记录 ({filteredTravels.length}/{data.travels.length})</h3>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="搜索标题或地点..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-full py-1.5 pl-8 pr-3 text-xs w-32 md:w-40 focus:outline-none focus:border-indigo-500/50"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    showFilters || selectedYear || selectedMonth || startDate || endDate || selectedLocations.length > 0 || selectedTags.length > 0 || showBookmarkedOnly
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      : "bg-black/20 text-slate-700 dark:text-slate-300 border-white/10 hover:bg-white/10"
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  筛选
                  {(selectedYear || selectedMonth || startDate || endDate || selectedLocations.length > 0 || selectedTags.length > 0) && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] ml-0.5">
                      {(selectedYear ? 1 : 0) + (selectedMonth ? 1 : 0) + (startDate || endDate ? 1 : 0) + (selectedLocations.length > 0 ? 1 : 0) + (selectedTags.length > 0 ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {selectedForBatch.length > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all">
                <span className="text-sm font-medium text-indigo-300 whitespace-nowrap">已选择 {selectedForBatch.length} 项</span>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 pr-3 border-r border-indigo-500/30">
                    <input
                      placeholder="批量打标签 (逗号分隔)"
                      value={batchTagsStr}
                      onChange={(e) => setBatchTagsStr(e.target.value)}
                      className="w-[140px] bg-black/20 border border-indigo-500/30 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-400 text-indigo-100"
                    />
                    <button
                      type="button"
                      disabled={batchLoading || !updateTravel || !batchTagsStr.trim()}
                      onClick={async () => {
                        if (!updateTravel || !batchTagsStr.trim()) return;
                        setBatchLoading(true);
                        const tags = batchTagsStr.split(',').map(s => s.trim()).filter(Boolean);
                        for (const id of selectedForBatch) {
                          const travel = data.travels.find(t => t.id === id);
                          if (travel) {
                            const newTags = Array.from(new Set([...(travel.tags || []), ...tags]));
                            await updateTravel(id, { tags: newTags });
                          }
                        }
                        setBatchTagsStr('');
                        setSelectedForBatch([]);
                        setBatchLoading(false);
                        showMessage("批量标签添加成功", false, () => window.location.reload());
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      {batchLoading && <Loader2 className="w-3 h-3 animate-spin"/>}
                      追加标签
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={batchLoading}
                      onClick={() => {
                        setBatchDeleteConfirm(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      {batchLoading && <Loader2 className="w-3 h-3 animate-spin"/>}
                      批量删除
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedForBatch([]); setBatchTagsStr(''); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-black/20 p-4 rounded-xl space-y-4 border border-white/5 mt-2">
                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> 时间段筛选
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-md py-1 px-2 text-xs focus:outline-none focus:border-indigo-500/50"
                        style={{ colorScheme: 'dark' }}
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-md py-1 px-2 text-xs focus:outline-none focus:border-indigo-500/50"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  {/* Year Filter */}
                  {filterOptions.years.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> 按年份
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.years.map(year => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleYearChange(year)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                              selectedYear === year 
                                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                                : "bg-white/5 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Month Filter */}
                  {selectedYear && filterOptions.months.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> 按月份
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.months.map(month => (
                          <button
                            key={month}
                            type="button"
                            onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                              selectedMonth === month 
                                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                                : "bg-white/5 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            {month}月
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Filter */}
                  {filterOptions.locations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> 按地点 (多选)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.locations.map(loc => {
                          const isSelected = selectedLocations.includes(loc);
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => toggleLocation(loc)}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                                isSelected 
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/50" 
                                  : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10"
                              )}
                            >
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags Filter */}
                  {filterOptions.tags.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                         按标签 (多选)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {filterOptions.tags.map(tag => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                                isSelected 
                                  ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50" 
                                  : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10"
                              )}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showBookmarkedOnly}
                        onChange={(e) => setShowBookmarkedOnly(e.target.checked)}
                        className="rounded border-white/20 bg-black/20 w-4 h-4 text-indigo-500 focus:ring-indigo-500/50 transition-colors"
                      />
                      只显示收藏记录
                    </label>
                  </div>

                  {/* Reset Selection */}
                  {(selectedYear || selectedMonth || startDate || endDate || selectedLocations.length > 0 || selectedTags.length > 0 || showBookmarkedOnly) && (
                    <div className="pt-2 border-t border-white/5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYear(null);
                          setSelectedMonth(null);
                          setStartDate('');
                          setEndDate('');
                          setSelectedLocations([]);
                          setSelectedTags([]);
                          setShowBookmarkedOnly(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        重置所有筛选
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-end mt-4 gap-2">
            <button
               type="button"
               onClick={() => {
                 setShowLocationManager(!showLocationManager);
                 if (!showLocationManager) setShowTagManager(false);
               }}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                 showLocationManager 
                   ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                   : "bg-black/20 text-slate-700 dark:text-slate-300 border-white/10 hover:bg-white/10"
               )}
            >
               <MapPin className="w-3.5 h-3.5" />
               {showLocationManager ? '收起地点管理' : '管理所有地点（重命名）'}
            </button>
            <button
               type="button"
               onClick={() => {
                 setShowTagManager(!showTagManager);
                 if (!showTagManager) setShowLocationManager(false);
               }}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                 showTagManager 
                   ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                   : "bg-black/20 text-slate-700 dark:text-slate-300 border-white/10 hover:bg-white/10"
               )}
            >
               <Tag className="w-3.5 h-3.5" />
               {showTagManager ? '收起标签管理' : '管理所有标签（重命名）'}
            </button>
          </div>

          <AnimatePresence>
             {showLocationManager && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 mb-4">
                      <h4 className="text-xs font-semibold text-white/70">所有地点 ({filterOptions.locations.length})</h4>
                      {filterOptions.locations.length === 0 && <p className="text-xs text-white/30">暂无地点</p>}
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                         {filterOptions.locations.map(loc => (
                            <div key={loc} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                               {editingLocation === loc ? (
                                  <div className="flex items-center gap-2 w-full">
                                     <input 
                                       value={newLocationVal} 
                                       onChange={e => setNewLocationVal(e.target.value)} 
                                       placeholder="新地点名" 
                                       className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500" 
                                     />
                                     <button 
                                        type="button" 
                                        disabled={locationLoading || !newLocationVal.trim()}
                                        onClick={async () => {
                                           if (!updateTravel || !newLocationVal.trim()) return;
                                           setLocationLoading(true);
                                           const finalNewLoc = newLocationVal.trim();
                                           let updatedCount = 0;
                                           for (const t of data.travels) {
                                              if (t.location === loc) {
                                                 await updateTravel(t.id, { location: finalNewLoc });
                                                 updatedCount++;
                                              }
                                           }
                                           setLocationLoading(false);
                                           setEditingLocation(null);
                                           showMessage(`已更新 ${updatedCount} 条记录的地点`, false, () => window.location.reload());
                                        }}
                                        className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-400 disabled:opacity-50"
                                     >
                                        {locationLoading ? '保存中...' : '保存'}
                                     </button>
                                     <button type="button" onClick={() => setEditingLocation(null)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20">取消</button>
                                  </div>
                               ) : (
                                  <>
                                     <span className="text-xs text-white flex-1">{loc}</span>
                                     <button type="button" onClick={() => { setEditingLocation(loc); setNewLocationVal(loc); }} className="text-[10px] text-indigo-300 hover:underline shrink-0">重命名</button>
                                  </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          <AnimatePresence>
             {showTagManager && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                      <h4 className="text-xs font-semibold text-white/70">所有标签 ({filterOptions.tags.length})</h4>
                      {filterOptions.tags.length === 0 && <p className="text-xs text-white/30">暂无标签</p>}
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                         {filterOptions.tags.map(tag => (
                            <div key={tag} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                               {editingTag === tag ? (
                                  <div className="flex items-center gap-2 w-full">
                                     <input 
                                       value={newTagVal} 
                                       onChange={e => setNewTagVal(e.target.value)} 
                                       placeholder="新标签名" 
                                       className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500" 
                                     />
                                     <button 
                                        type="button" 
                                        disabled={tagLoading || !newTagVal.trim()}
                                        onClick={async () => {
                                           if (!updateTravel || !newTagVal.trim()) return;
                                           setTagLoading(true);
                                           const finalNewTag = newTagVal.trim();
                                           let updatedCount = 0;
                                           for (const t of data.travels) {
                                              if (t.tags && t.tags.includes(tag)) {
                                                 const newTags = t.tags.map(x => x === tag ? finalNewTag : x);
                                                 // remove duplicates if replacing with an existing tag
                                                 const dedupedTags = Array.from(new Set(newTags));
                                                 await updateTravel(t.id, { tags: dedupedTags });
                                                 updatedCount++;
                                              }
                                           }
                                           setTagLoading(false);
                                           setEditingTag(null);
                                           showMessage(`已更新 ${updatedCount} 条记录的标签`, false, () => window.location.reload());
                                        }}
                                        className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-400 disabled:opacity-50"
                                     >
                                        {tagLoading ? '保存中...' : '保存'}
                                     </button>
                                     <button type="button" onClick={() => setEditingTag(null)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20">取消</button>
                                  </div>
                               ) : (
                                  <>
                                     <span className="text-xs text-white flex-1">{tag}</span>
                                     <button type="button" onClick={() => { setEditingTag(tag); setNewTagVal(tag); }} className="text-[10px] text-indigo-300 hover:underline shrink-0">重命名</button>
                                  </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {filteredTravels.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">无符合条件的记录</p>
            ) : (
              filteredTravels.map(travel => (
                <div key={travel.id} className={cn("flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-colors", editingId === travel.id ? "bg-indigo-500/20 border-indigo-500/50" : "bg-black/20 border-white/5 hover:bg-white/5")} onClick={() => editingId === travel.id ? cancelEdit() : startEdit(travel)}>
                  <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedForBatch.includes(travel.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedForBatch(p => [...p, travel.id]);
                        else setSelectedForBatch(p => p.filter(id => id !== travel.id));
                      }}
                      className="rounded w-4 h-4 bg-black/20 border-white/20 text-indigo-500 focus:ring-indigo-500/50 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col truncate pr-2 flex-1">
                    <span className="text-sm text-white/90 truncate flex items-center gap-2">
                       {travel.title || travel.location}
                       <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 rounded border border-sky-500/30 shrink-0">
                         {travel.imageUrls ? travel.imageUrls.length : (travel.imageUrl ? 1 : 0)} 张照片
                       </span>
                       {travel.bookmarked && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1 rounded border border-yellow-500/30">收藏</span>}
                       <span className="text-xs text-white/50 border border-white/10 px-1 rounded shrink-0">{travel.location}</span>
                    </span>
                    <span className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
                      {travel.date}
                      {travel.tags && travel.tags.length > 0 && (
                        <span className="text-indigo-300 truncate">
                          · {travel.tags.join(', ')}
                        </span>
                      )}
                    </span>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(travel.id); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-red-400 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="删除旅行记录"
        message="确定要删除这条旅行记录吗？一旦删除将无法恢复，关联的服务器图片也会被永久移除。"
        onConfirm={confirmDeleteTravel}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        isOpen={batchDeleteConfirm}
        title="批量删除记录"
        message={`确定要删除选中的 ${selectedForBatch.length} 项记录吗？一旦删除将无法恢复，关联的服务器图片也会被永久移除。`}
        onConfirm={async () => {
          setBatchDeleteConfirm(false);
          setBatchLoading(true);
          for (const id of selectedForBatch) {
            await deleteTravel(id);
          }
          setSelectedForBatch([]);
          setBatchLoading(false);
          showMessage("批量删除成功", false, () => window.location.reload());
        }}
        onCancel={() => setBatchDeleteConfirm(false)}
      />
      
      <MessageModal 
        isOpen={modalOpen} 
        isError={modalIsError} 
        message={modalMessage} 
        onClose={() => {
          setModalOpen(false);
          if (modalCallback) modalCallback();
        }} 
      />
    </section>
  );
}

function BookmarkAdder({ token }: { token: string }) {
  const { data, addBookmark, deleteBookmark } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Message Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalIsError, setModalIsError] = useState(false);
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const showMessage = (msg: string, isErr: boolean = false, cb?: () => void) => {
    setModalMessage(msg);
    setModalIsError(isErr);
    if (cb) setModalCallback(() => cb);
    else setModalCallback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await addBookmark(form);
      if (!success) throw new Error('添加失败，请刷新登录');
      showMessage('书签添加成功', false, () => {
        setForm({ title: '', url: '', description: '' });
        window.location.reload();
      });
    } catch (err: any) {
      showMessage(err.message || '添加失败', true);
    }
    setLoading(false);
  };

  const confirmDeleteBookmark = async () => {
    if (!deleteConfirm) return;
    try {
      const success = await deleteBookmark(deleteConfirm);
      if (!success) throw new Error('删除失败，请刷新登录');
      showMessage('书签已删除', false, () => window.location.reload());
    } catch (err: any) {
      showMessage(err.message || '删除失败', true);
    }
    setDeleteConfirm(null);
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
      <h2 className="text-xl font-medium">常用收藏管理</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="请输入标题"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
        />
        <input
          required
          type="url"
          placeholder="https://..."
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
        />
        <textarea
          required
          placeholder="简略描述"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 添加书签</>}
        </button>
      </form>
      
      {data?.bookmarks && data.bookmarks.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/70">已有书签</h3>
          {data.bookmarks.map(bookmark => (
            <div key={bookmark.id} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl group/bmk">
              <div className="flex flex-col truncate pr-4">
                <span className="text-sm text-white/90 truncate">{bookmark.title}</span>
                <span className="text-xs text-indigo-400 truncate hover:underline cursor-pointer">{bookmark.url}</span>
              </div>
              <button onClick={() => setDeleteConfirm(bookmark.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="删除书签"
        message="确定要删除这个书签吗？"
        onConfirm={confirmDeleteBookmark}
        onCancel={() => setDeleteConfirm(null)}
      />

      <MessageModal 
        isOpen={modalOpen} 
        isError={modalIsError} 
        message={modalMessage} 
        onClose={() => {
          setModalOpen(false);
          if (modalCallback) modalCallback();
        }} 
      />
    </section>
  );
}
