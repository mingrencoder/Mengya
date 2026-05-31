import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { MapPin, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Travels() {
  const { data, loading } = useData();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-white/5" />;

  const travels = [...data.travels].reverse(); // Newest first

  return (
    <div className="space-y-8">
      <header className='flex items-end justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-white tracking-tight'>旅行记录</h1>
          <p className='text-slate-400 mt-1'>记录在世界各地的足迹。</p>
        </div>
      </header>

      {travels.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-dashed">
          <p className="text-white/30">暂无旅行记录。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {travels.map((travel, i) => (
            <motion.div
              key={travel.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-6 flex flex-col group"
            >
              <div 
                className="h-48 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(travel.imageUrl)}
              >
                <div className="absolute inset-0 border border-white/5 z-10 pointer-events-none"></div>
                <img 
                  src={travel.imageUrl} 
                  alt={travel.location}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className='absolute top-3 right-3 glass px-2 py-1 rounded text-[10px] font-mono border border-white/10 z-20 text-white'>
                  {travel.date}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{travel.location}</h3>
                {travel.description && (
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                    {travel.description}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">加密存储：正常</div>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                  <MapPin className="w-3 h-3" />
                  {travel.location.split(',')[0]}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
