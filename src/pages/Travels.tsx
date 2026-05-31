import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Travels() {
  const { data, loading } = useData();
  const [selectedTravel, setSelectedTravel] = useState<any>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-white/5" />;

  const travels = [...data.travels].reverse(); // Newest first

  const openLightbox = (travel: any) => {
    setSelectedTravel(travel);
    setCurrentImgIndex(travel.coverImageIndex || 0);
  };

  const getLightboxImages = () => {
    if (!selectedTravel) return [];
    if (selectedTravel.imageUrls && selectedTravel.imageUrls.length > 0) return selectedTravel.imageUrls;
    if (selectedTravel.imageUrl) return [selectedTravel.imageUrl];
    return [];
  };

  const lightboxImages = getLightboxImages();

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
          {travels.map((travel, i) => {
            const coverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
            
            return (
              <motion.div
                key={travel.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6 flex flex-col group relative"
              >
                {coverImage && (
                  <div 
                    className="h-48 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-5 flex items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => openLightbox(travel)}
                  >
                    <div className="absolute inset-0 border border-white/5 z-10 pointer-events-none"></div>
                    <img 
                      src={coverImage} 
                      alt={travel.location}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className='absolute top-3 right-3 glass px-2 py-1 rounded text-[10px] font-mono border border-white/10 z-20 text-white'>
                      {travel.date}
                    </div>
                    {travel.imageUrls && travel.imageUrls.length > 1 && (
                       <div className="absolute bottom-3 right-3 glass px-2 py-1 rounded-full text-xs font-medium text-white z-20 flex items-center gap-1 shadow-lg backdrop-blur-md bg-black/40">
                         +{travel.imageUrls.length - 1}张相片
                       </div>
                    )}
                  </div>
                )}
                {!coverImage && (
                  <div className='absolute top-3 right-3 glass px-2 py-1 rounded text-[10px] font-mono border border-white/10 z-20 text-white'>
                    {travel.date}
                  </div>
                )}
                <div className="flex-1 mt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{travel.title || travel.location}</h3>
                  {travel.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {travel.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col text-[10px] text-slate-500">
                    <span className="uppercase font-semibold tracking-wider">地点</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-md">
                    <MapPin className="w-3 h-3" />
                    {travel.location}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox using Portal to escape stacking context */}
      {createPortal(
        <AnimatePresence>
          {selectedTravel && lightboxImages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
              onClick={() => setSelectedTravel(null)}
            >
              <button 
                className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                onClick={() => setSelectedTravel(null)}
              >
                <X className="w-6 h-6" />
              </button>
              
              {lightboxImages.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 lg:left-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === 0 ? lightboxImages.length - 1 : prev - 1); }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button 
                    className="absolute right-4 lg:right-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === lightboxImages.length - 1 ? 0 : prev + 1); }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                    {lightboxImages.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={cn("w-2 h-2 rounded-full transition-all", idx === currentImgIndex ? "bg-white scale-125" : "bg-white/30")}
                      />
                    ))}
                  </div>
                </>
              )}

              <AnimatePresence mode='wait'>
                 <motion.img 
                  key={currentImgIndex}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.2 }}
                  src={lightboxImages[currentImgIndex]} 
                  alt="Preview" 
                  className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
