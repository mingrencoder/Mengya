import React from 'react';
import { useData } from '../lib/DataContext';
import { Server, Database, Shield, MoveRight } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  const { data, loading } = useData();

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-white/5" />;

  return (
    <div className="space-y-12">
      <header className='flex items-end justify-between mb-8 max-w-2xl'>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            系统在线
          </div>
          <h1 className='text-3xl md:text-5xl font-bold text-white tracking-tight'>
            {data.home.title}
          </h1>
          <p className='text-lg md:text-xl text-slate-400 mt-4 leading-relaxed font-light'>
            {data.home.description}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Server, title: '无数据库', desc: '基于本地文件系统读写运行。' },
          { icon: Shield, title: '加密存储', desc: '安全的 AES-256-CBC 本地加密。' },
          { icon: Database, title: '轻量化', desc: '极小资源占用，无缝快速部署。' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <feature.icon className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="font-medium text-white/90">{feature.title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="relative z-10 max-w-lg">
          <p className="text-2xl font-light text-white italic tracking-wide">
            "{data.home.welcomeMessage}"
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors cursor-pointer w-fit">
            探索旅程 <MoveRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
