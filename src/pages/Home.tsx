import React from 'react';
import { useData } from '../lib/DataContext';
import { MoveRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export function Home() {
  const { data, loading } = useData();

  if (loading || !data) {
    return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />;
  }

  const { home } = data;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <header className='flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 max-w-3xl'>
        <div className="flex items-center gap-6">
          {home.avatarUrl && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl md:rounded-3xl overflow-hidden glass p-1 shadow-2xl"
            >
              <img src={home.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl md:rounded-2xl bg-black/50" />
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              系统在线
            </div>
            <h1 className='text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight'>
              {home.title || "萌芽记录空间"}
            </h1>
          </motion.div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden group max-w-4xl"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="relative z-10 max-w-2xl">
          {home.welcomeMessage && (
            <p className="text-2xl md:text-3xl font-light text-slate-800 dark:text-white italic tracking-wide mb-6">
              "{home.welcomeMessage}"
            </p>
          )}
          {home.description && (
            <p className='text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light whitespace-pre-wrap'>
              {home.description}
            </p>
          )}
          
          <Link to="/travels" className="mt-8 flex items-center gap-3 text-sm text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer w-fit group/link">
            探索旅程 <MoveRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>

      {/* Dynamic Custom Blocks */}
      {home.customBlocks && home.customBlocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {home.customBlocks.map((block, i) => (
            <motion.div
              key={block.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass-card rounded-3xl p-6 flex flex-col items-start gap-4 overflow-hidden relative"
            >
              {block.type === 'image' && block.url ? (
                <div className="w-full h-48 rounded-2xl overflow-hidden bg-black/20 mb-2 border border-slate-200 dark:border-white/5">
                  <img src={block.url} alt="Block image" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : null}
              
              {block.title && (
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white tracking-tight">{block.title}</h3>
              )}
              
              {block.content && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap flex-1">
                  {block.content}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
