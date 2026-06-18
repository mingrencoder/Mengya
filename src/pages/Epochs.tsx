import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../lib/DataContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Tag, Edit2, Trash2, Check, Lock, Eye, EyeOff, Settings, ZoomIn, RotateCcw } from 'lucide-react';
import { EpochCategory, EpochEvent } from '../types';
import { cn } from '../lib/utils';
import { ConfirmModal } from '../components/ConfirmModal';

export function Epochs() {
  const { data, loading, refresh, addEpochEvent, updateEpochEvent, deleteEpochEvent, addEpochCategory, updateEpochCategory, deleteEpochCategory } = useData();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [scale, setScale] = useState<number>(1);
  
  // Auth state
  const isLocked = data && data.isTravelAuthorized === false;
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/travel-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('travel_token', token);
        await refresh();
      } else {
        setLoginError('密码错误');
      }
    } catch (e) {
      setLoginError('登录失败');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'list' | 'form' | 'category-manager'>('list');
  const [prevModalMode, setPrevModalMode] = useState<'list' | 'form' | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  // List mode state
  const [dayEvents, setDayEvents] = useState<EpochEvent[]>([]);
  
  // Form state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', desc: '', categoryId: '' });
  
  // Category Manager State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('');
  const [catDeleteConfirmId, setCatDeleteConfirmId] = useState<string | null>(null);
  const [eventDeleteConfirmId, setEventDeleteConfirmId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState('');

  const categories = data?.epochCategories || [];
  const events = data?.epochEvents || [];
  
  const eventsMap = useMemo(() => {
    const map = new Map<string, EpochEvent[]>();
    events.forEach(e => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  const catMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const dates = [];
    const date = new Date(selectedYear, i, 1);
    while (date.getMonth() === i) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  });

  const openListModal = (dateStr: string, evts: EpochEvent[]) => {
    setSelectedDateStr(dateStr);
    setDayEvents(evts);
    setModalMode('list');
    setModalOpen(true);
  };

  const openCategoryManager = () => {
    setPrevModalMode(null);
    setSelectedDateStr('');
    setModalMode('category-manager');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (modalMode === 'category-manager' && prevModalMode) {
      setModalMode(prevModalMode);
      setPrevModalMode(null);
    } else {
      setModalOpen(false);
    }
  };

  const openFormModal = (dateStr: string, evt?: EpochEvent) => {
    setSelectedDateStr(dateStr);
    if (evt) {
      setEditingEventId(evt.id);
      setFormData({ title: evt.title, desc: evt.desc || '', categoryId: evt.categoryId });
    } else {
      setEditingEventId(null);
      setFormData({ title: '', desc: '', categoryId: categories[0]?.id || '' });
    }
    setModalMode('form');
    setModalOpen(true);
  };

  const handleCellClick = (dateStr: string) => {
    const evts = eventsMap.get(dateStr) || [];
    if (evts.length > 0) {
      openListModal(dateStr, evts);
    } else {
      openFormModal(dateStr);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    if (!formData.categoryId) {
      setAlertMsg('请选择一个关联的分类标签（如果没有请先创建）');
      return;
    }
    
    if (editingEventId) {
      await updateEpochEvent(editingEventId, { ...formData });
    } else {
      await addEpochEvent({ ...formData, date: selectedDateStr });
    }
    
    setModalOpen(false);
  };

  const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#4f46e5', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#94a3b8', '#78716c'
  ];

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.name === trimmed)) {
      setAlertMsg('分类名称已存在');
      return;
    }
    await addEpochCategory({ name: trimmed, color: newCatColor });
    setNewCatName('');
  };

  const startEditCat = (c: EpochCategory) => {
    setEditingCatId(c.id);
    setEditingCatName(c.name);
    setEditingCatColor(c.color);
  };

  const saveCatChanges = async (id: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.id !== id && c.name === trimmed)) {
      setAlertMsg('分类名称已存在');
      return;
    }
    await updateEpochCategory(id, { name: trimmed, color: editingCatColor });
    setEditingCatId(null);
  };

  const handlePresetColorClick = (color: string) => {
    if (editingCatId) {
      setEditingCatColor(color);
    } else {
      setNewCatColor(color);
    }
  };

  const activeColor = editingCatId ? editingCatColor : newCatColor;

  const getDayStyle = (dateStr: string) => {
    const evts = eventsMap.get(dateStr) || [];
    if (evts.length === 0) return { className: 'bg-[#1a1a1a] border border-white/[0.05] hover:border-white/20' };
    
    if (evts.length === 1) {
      const color = catMap.get(evts[0].categoryId)?.color || '#6366f1';
      return {
        className: 'border border-white/20',
        style: { backgroundColor: color, boxShadow: `0 0 16px ${color}80, inset 0 0 10px ${color}` }
      };
    }
    
    return {
      className: 'border border-white/20',
      style: { 
        background: 'linear-gradient(135deg, #00f2fe, #4facfe, #6260ff, #ff0844)', 
        boxShadow: '0 0 20px rgba(98, 96, 255, 0.6), inset 0 0 15px rgba(255, 8, 68, 0.4)' 
      }
    };
  };

  return (
    <div className="min-h-[80vh] relative mt-10">
      {loading || !data ? (
        <div className="animate-pulse flex h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
      ) : isLocked ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="glass p-8 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl flex flex-col items-center bg-[#111111]/80 backdrop-blur-md">
             <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-indigo-500" />
             </div>
             <h2 className="text-xl font-bold dark:text-white mb-2">访问受限</h2>
             <p className="text-slate-400 text-sm text-center mb-6">此区域需要输入时光密码。</p>
             <form onSubmit={handleLogin} className="w-full space-y-4">
                <div className="relative">
                  <input 
                     type={showPassword ? "text" : "password"} 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-[#111] border border-white/20 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-indigo-500/50 shadow-inner"
                     placeholder="请输入时光密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginError && <p className="text-red-500 text-xs px-1">{loginError}</p>}
                <button 
                  type="submit" 
                  disabled={isLoggingIn || !password}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-3 font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50"
                >
                  {isLoggingIn ? '验证中...' : '验证进入'}
                </button>
             </form>
          </div>
        </div>
      ) : (
        <>
          {/* Background Orbs */}
          <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none z-[-1]" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-500/20 rounded-full blur-[150px] pointer-events-none z-[-1]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold dark:text-[#ededed] tracking-tight">时光纪元</h1>
          <p className="text-sm dark:text-white/50 mt-1">记录每个闪耀时刻</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Scale Slider */}
          <div className="hidden sm:flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 shadow-lg h-[46px]">
            <ZoomIn className="w-4 h-4 text-white/50" />
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.05" 
              value={scale} 
              onChange={e => setScale(parseFloat(e.target.value))}
              className="w-20 sm:w-28 accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-white/50 w-8 text-right font-mono">{Math.round(scale * 100)}%</span>
            {scale !== 1 && (
              <button 
                onClick={() => setScale(1)} 
                className="text-white/30 hover:text-white/70 ml-1 transition-colors"
                title="重置缩放"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-lg w-max">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 dark:text-white/70 hover:dark:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold dark:text-white min-w-[4rem] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 dark:text-white/70 hover:dark:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={openCategoryManager} 
            className="p-3.5 bg-[#111111]/80 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl dark:text-white/70 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all hover:scale-105"
            title="管理分类"
          >
            <Tag className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        className="grid gap-3 sm:gap-4 lg:gap-5 justify-center w-full mt-2 transition-all duration-300"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(100, 240 * scale)}px, 1fr))`
        }}
      >
        {months.map((days, index) => (
          <div key={index} className="bg-[#111111]/80 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl p-3 sm:p-4 flex flex-col space-y-3 w-full">
            <div className="flex items-center gap-2 px-1">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-sm dark:text-[#ededed]">{index + 1} 月</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-2">
              <div className="text-[10px] text-center text-white/30 mb-1">日</div>
              <div className="text-[10px] text-center text-white/30 mb-1">一</div>
              <div className="text-[10px] text-center text-white/30 mb-1">二</div>
              <div className="text-[10px] text-center text-white/30 mb-1">三</div>
              <div className="text-[10px] text-center text-white/30 mb-1">四</div>
              <div className="text-[10px] text-center text-white/30 mb-1">五</div>
              <div className="text-[10px] text-center text-white/30 mb-1">六</div>
              
              {/* Padding days */}
              {Array.from({ length: days[0].getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square opacity-0" />
              ))}
              
              {days.map(d => {
                const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
                const { className, style } = getDayStyle(dateStr);
                const isToday = new Date().toLocaleDateString('en-CA') === dateStr;
                
                const finalStyle = { ...style };
                if (isToday) {
                  finalStyle.outline = "2px solid #fff";
                  finalStyle.outlineOffset = "2px";
                  const existingShadow = style?.boxShadow || '';
                  finalStyle.boxShadow = existingShadow ? `${existingShadow}, 0 0 20px rgba(255,255,255,0.8)` : '0 0 20px rgba(255,255,255,0.8)';
                }

                return (
                  <button
                    key={d.getDate()}
                    onClick={() => handleCellClick(dateStr)}
                    style={finalStyle}
                    title={dateStr}
                    className={cn(
                      "aspect-square rounded-md transition-all duration-300 relative group flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-[1.15] z-10 overflow-hidden",
                      className,
                      isToday && "z-30 scale-[1.1] !opacity-100 font-bold"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] sm:text-[11px] transition-colors drop-shadow-md",
                      isToday ? "text-white font-bold" : "text-white/90 font-medium group-hover:text-white"
                    )}>{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md" onClick={handleCloseModal}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111111]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-[#ededed]">{selectedDateStr || '时光纪元'}</h3>
                  <p className="text-xs text-white/50 mt-1">
                    {modalMode === 'list' && '当日事件'}
                    {modalMode === 'form' && (editingEventId ? '编辑事件' : '新增事件')}
                    {modalMode === 'category-manager' && '分类管理'}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LIST MODE */}
              {modalMode === 'list' && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {dayEvents.map(evt => {
                      const cat = catMap.get(evt.categoryId);
                      return (
                        <div key={evt.id} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 group flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat?.color || '#fff' }} />
                              <span className="text-xs font-medium" style={{ color: cat?.color }}>{cat?.name || '未知分类'}</span>
                            </div>
                            <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{evt.title}</h4>
                            {evt.desc && <p className="text-sm text-white/60 mt-1 leading-relaxed">{evt.desc}</p>}
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openFormModal(selectedDateStr, evt)} className="p-1.5 text-white/50 hover:text-white bg-black/20 rounded-lg"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button onClick={() => setEventDeleteConfirmId(evt.id)} className="p-1.5 text-red-500/50 hover:text-red-500 bg-black/20 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => openFormModal(selectedDateStr)}
                    className="w-full py-3.5 border border-white/10 border-dashed rounded-2xl text-white/60 hover:text-white hover:bg-white/5 hover:border-white/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" /> 记录新事件
                  </button>
                </div>
              )}

              {/* FORM MODE */}
              {modalMode === 'form' && (
                <form onSubmit={handleSaveEvent} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 ml-1">事件标题</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-[#111] border border-white/20 shadow-inner rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="这一发生的大事..." 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs text-white/50">分类标签</label>
                      <button type="button" onClick={() => { setPrevModalMode('form'); setModalMode('category-manager'); }} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        <Tag className="w-3 h-3" /> 修改分类
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({...formData, categoryId: c.id})}
                          style={{
                            backgroundColor: formData.categoryId === c.id ? `${c.color}20` : 'transparent',
                            borderColor: formData.categoryId === c.id ? c.color : 'rgba(255,255,255,0.1)',
                            color: formData.categoryId === c.id ? c.color : 'rgba(255,255,255,0.6)'
                          }}
                          className="px-3 py-1.5 rounded-xl border text-sm font-medium transition-all hover:scale-105"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/50 ml-1">详细纪要 (可选)</label>
                    <textarea 
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                      className="w-full h-24 bg-[#111] border border-white/20 shadow-inner rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none custom-scrollbar"
                      placeholder="记录下更多细节..." 
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    {dayEvents.length > 0 && !editingEventId && (
                      <button type="button" onClick={() => setModalMode('list')} className="flex-1 py-3 text-white/60 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-medium">返回列表</button>
                    )}
                    <button type="submit" className="flex-1 py-3 text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.02] font-medium">
                      保存记录
                    </button>
                  </div>
                </form>
              )}

              {/* CATEGORY MANAGER MODE */}
              {modalMode === 'category-manager' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-[#111] border border-white/20 shadow-inner rounded-xl p-2 pr-3">
                      <input 
                        type="color" 
                        value={newCatColor} 
                        onChange={e => setNewCatColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0 color-input-wrapper"
                      />
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="分类名称"
                        className="flex-1 bg-transparent border-none text-white focus:outline-none"
                      />
                      <button onClick={handleAddCategory} disabled={!newCatName} className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-transform hover:scale-105 disabled:opacity-50">
                        <Plus className="w-4 h-4"/>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 px-1">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handlePresetColorClick(color)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all hover:scale-110",
                            activeColor === color ? "ring-2 ring-offset-2 ring-offset-[#111] ring-white scale-110" : ""
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5 group">
                        {editingCatId === c.id ? (
                          <div className="flex items-center gap-3 w-full">
                            <input 
                              type="color" 
                              value={editingCatColor} 
                              onChange={e => setEditingCatColor(e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 p-0 color-input-wrapper shrink-0"
                            />
                            <input 
                              type="text" 
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              className="flex-1 bg-[#111] border border-white/20 px-2 py-1 rounded text-sm text-white focus:outline-none"
                            />
                            <button onClick={() => saveCatChanges(c.id)} className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingCatId(null)} className="p-1.5 text-white/50 hover:bg-white/10 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: c.color, color: c.color }} />
                              <span className="text-sm font-medium text-white">{c.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditCat(c)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setCatDeleteConfirmId(c.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {prevModalMode && (
                    <button type="button" onClick={() => { setModalMode(prevModalMode); setPrevModalMode(null); }} className="w-full py-3 text-white/60 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-medium">
                      返回表单
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!catDeleteConfirmId}
        title="删除分类"
        message="确定删除此分类吗？包含该分类的事件将会失去分类关联。"
        confirmText="确认删除"
        type="danger"
        onConfirm={async () => {
          if (catDeleteConfirmId) await deleteEpochCategory(catDeleteConfirmId);
          setCatDeleteConfirmId(null);
        }}
        onCancel={() => setCatDeleteConfirmId(null)}
      />

      <ConfirmModal
        isOpen={!!eventDeleteConfirmId}
        title="删除事件"
        message="确定删除此事件记录吗？此操作不可恢复。"
        confirmText="确认删除"
        type="danger"
        onConfirm={async () => {
          if (eventDeleteConfirmId) {
            await deleteEpochEvent(eventDeleteConfirmId);
            setDayEvents(prev => prev.filter(e => e.id !== eventDeleteConfirmId));
          }
          setEventDeleteConfirmId(null);
          if (dayEvents.length <= 1) {
             setModalOpen(false);
          }
        }}
        onCancel={() => setEventDeleteConfirmId(null)}
      />

      <ConfirmModal
        isOpen={!!alertMsg}
        title="提示"
        message={alertMsg}
        confirmText="知道了"
        type="info"
        isAlert={true}
        onConfirm={() => setAlertMsg('')}
        onCancel={() => setAlertMsg('')}
      />

      <style>{`
        .color-input-wrapper::-webkit-color-swatch-wrapper { padding: 0; }
        .color-input-wrapper::-webkit-color-swatch { border: none; border-radius: 8px; }
      `}</style>
      </>
      )}
    </div>
  );
}
