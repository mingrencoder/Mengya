import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { Lock, LogOut, Plus, Upload, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

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
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-white/70" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">管理员访问</h2>
            <p className="text-sm text-white/50 mt-1">请输入密码以管理内容</p>
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
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors text-sm"
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
          <p className='text-slate-400 mt-1'>管理您的萌芽空间。</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors text-white"
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
  const { data, refresh } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(data ? data.home : { title: '', description: '', welcomeMessage: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/data/home', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    refresh();
    setLoading(false);
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 flex-1 h-fit">
      <h2 className="text-xl font-medium">首页设置</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
        </button>
      </form>
    </section>
  );
}

function TravelAdder({ token }: { token: string }) {
  const { refresh } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ location: '', date: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('必须上传图片');
    setLoading(true);

    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      // 2. Create Travel record
      await fetch('/api/data/travels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, imageUrl: uploadData.url })
      });

      refresh();
      setForm({ location: '', date: '', description: '' });
      setFile(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
      <h2 className="text-xl font-medium">添加旅行记录</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            placeholder="地点"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
          />
          <input
            required
            type="date"
            placeholder="日期"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm color-scheme-dark"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <textarea
          placeholder="描述（选填）"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm resize-none"
        />
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={cn(
              "flex flex-col items-center justify-center w-full aspect-[21/9] rounded-xl border-2 border-dashed transition-colors cursor-pointer",
              file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 hover:border-white/20 bg-black/20"
            )}
          >
            {file ? (
              <span className="text-sm text-indigo-300">{file.name}</span>
            ) : (
              <>
                <Upload className="w-6 h-6 text-white/40 mb-2" />
                <span className="text-sm text-white/40">将图片拖拽到此处，或点击上传</span>
              </>
            )}
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || !file || !form.location || !form.date}
          className="w-full bg-white text-black px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 添加记录</>}
        </button>
      </form>
    </section>
  );
}

function BookmarkAdder({ token }: { token: string }) {
  const { refresh } = useData();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/data/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    refresh();
    setForm({ title: '', url: '', description: '' });
    setLoading(false);
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl space-y-6">
      <h2 className="text-xl font-medium">添加书签</h2>
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
          disabled={loading || !form.title || !form.url || !form.description}
          className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 添加书签</>}
        </button>
      </form>
    </section>
  );
}
