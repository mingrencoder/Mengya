import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { Lock, LogOut, Plus, Upload, Loader2, Trash2, X, Search, Filter, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CustomBlock, HomeData } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
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
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                autoFocus
              />
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
    <div className="space-y-8">
      <header className='flex items-end justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-white tracking-tight'>控制台</h1>
          <p className='text-slate-600 dark:text-slate-400 mt-1'>管理您的萌芽空间。</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-white"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <HomeEditor token={token} />
          <PasswordEditor token={token} />
        </div>
        <div className="space-y-8">
          <TravelAdder token={token} />
          <BookmarkAdder token={token} />
        </div>
      </div>
    </div>
  );
}

function PasswordEditor({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      
      if (res.ok) {
        setMessage('密码修改成功');
        setNewPassword('');
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
      <h2 className="text-xl font-medium">修改管理员密码</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 px-1">新密码</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码"
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
        </div>
        {message && <p className={cn("text-xs", message.includes('成功') ? "text-emerald-400" : "text-red-400")}>{message}</p>}
        <button
          type="submit"
          disabled={loading || !newPassword}
          className="bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '修改密码'}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = form.avatarUrl;

    if (avatarFile) {
      const formData = new FormData();
      formData.append('image', avatarFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.url;
      }
    }

    await updateHomeConfig({ ...form, avatarUrl });
    setLoading(false);
    setAvatarFile(null);
  };

  const handleUploadBlockImage = async (index: number, file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        updateBlock(index, { url: uploadData.url });
      } else {
        alert('上传失败');
      }
    } catch {
      alert('上传发生错误');
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
              <div key={i} className="bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3 relative group">
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
                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0 overflow-hidden">
                          <img src={block.url} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer hover:bg-white/10 transition-colors inline-block text-slate-700 dark:text-white/80">
                        上传文件
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadBlockImage(i, e.target.files?.[0] || null)} />
                      </label>
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
    </section>
  );
}

function TravelAdder({ token }: { token: string }) {
  const { data, addTravel, updateTravel, deleteTravel } = useData();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', location: '', date: '', description: '', coverImageIndex: 0 });
  const [files, setFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Extract filter options
  const filterOptions = React.useMemo(() => {
    if (!data?.travels) return { years: [], months: [], locations: [] };
    
    const years = new Set<string>();
    const months = new Set<string>();
    const locations = new Set<string>();

    data.travels.forEach(t => {
      if (t.location) locations.add(t.location);
      
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
      locations: Array.from(locations).sort()
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

  const filteredTravels = React.useMemo(() => {
    if (!data?.travels) return [];
    
    return data.travels.filter(t => {
      const matchesSearch = searchQuery 
        ? t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.location?.toLowerCase().includes(searchQuery.toLowerCase())
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

      const matchesLocation = selectedLocations.length > 0 
        ? selectedLocations.includes(t.location)
        : true;

      return matchesSearch && matchesYear && matchesMonth && matchesLocation;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data?.travels, searchQuery, selectedYear, selectedMonth, selectedLocations]);

  const startEdit = (travel: any) => {
    setEditingId(travel.id);
    setForm({
      title: travel.title || '',
      location: travel.location || '',
      date: travel.date || '',
      description: travel.description || '',
      coverImageIndex: travel.coverImageIndex || 0,
    });
    setFiles([]);
    setExistingImageUrls(travel.imageUrls || (travel.imageUrl ? [travel.imageUrl] : []));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', location: '', date: '', description: '', coverImageIndex: 0 });
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

  const confirmDeleteTravel = async () => {
    if (!deleteConfirm) return;
    await deleteTravel(deleteConfirm);
    if (editingId === deleteConfirm) {
      cancelEdit();
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
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
        newUrls.push(uploadData.url);
      }

      const finalUrls = [...existingImageUrls, ...newUrls];
      
      const payload = {
        ...form,
        imageUrls: finalUrls,
        imageUrl: finalUrls[form.coverImageIndex] || finalUrls[0] || undefined // for backward compat
      };

      if (editingId && updateTravel) {
        await updateTravel(editingId, payload);
      } else {
        await addTravel(payload);
      }

      cancelEdit();
    } catch (e: any) {
      alert(e.message);
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
        <input
          required
          type="date"
          placeholder="日期"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm color-scheme-dark"
          style={{ colorScheme: 'dark' }}
        />
        <textarea
          placeholder="描述（选填）"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none"
        />
        
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
              className={cn(
                "flex flex-col items-center justify-center w-full aspect-[21/9] rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                files.length > 0 ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 hover:border-white/20 bg-black/20"
              )}
            >
              {files.length > 0 ? (
                <span className="text-sm text-indigo-300">已选择 {files.length} 张图片</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-white/40 mb-2" />
                  <span className="text-sm text-white/40">点击此处选择上传多张图片</span>
                </>
              )}
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
                  showFilters || selectedYear || selectedMonth || selectedLocations.length > 0
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    : "bg-black/20 text-slate-700 dark:text-slate-300 border-white/10 hover:bg-white/10"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                筛查
                {(selectedYear || selectedMonth || selectedLocations.length > 0) && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] ml-0.5">
                    {(selectedYear ? 1 : 0) + (selectedMonth ? 1 : 0) + (selectedLocations.length > 0 ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
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

                  {/* Reset Selection */}
                  {(selectedYear || selectedMonth || selectedLocations.length > 0) && (
                    <div className="pt-2 border-t border-white/5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYear(null);
                          setSelectedMonth(null);
                          setSelectedLocations([]);
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

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {filteredTravels.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">无符合条件的记录</p>
            ) : (
              filteredTravels.map(travel => (
                <div key={travel.id} className={cn("flex items-center justify-between border p-3 rounded-xl cursor-pointer transition-colors", editingId === travel.id ? "bg-indigo-500/20 border-indigo-500/50" : "bg-black/20 border-white/5 hover:bg-white/5")} onClick={() => editingId === travel.id ? cancelEdit() : startEdit(travel)}>
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-sm text-white/90 truncate">{travel.title || travel.location} <span className="text-xs text-white/50 border border-white/10 px-1 rounded ml-1 shrink-0">{travel.location}</span></span>
                    <span className="text-xs text-white/50">{travel.date}</span>
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
    </section>
  );
}

function BookmarkAdder({ token }: { token: string }) {
  const { data, addBookmark, deleteBookmark } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addBookmark(form);
    setForm({ title: '', url: '', description: '' });
    setLoading(false);
  };

  const confirmDeleteBookmark = async () => {
    if (!deleteConfirm) return;
    await deleteBookmark(deleteConfirm);
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
    </section>
  );
}
