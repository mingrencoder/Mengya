import React, { useState, useMemo } from 'react';
import { useData } from '../lib/DataContext';
import { ExternalLink, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function Bookmarks() {
  const { data, loading } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-white/5" />;

  const bookmarks = data.bookmarks || [];
  const totalPages = Math.ceil(bookmarks.length / ITEMS_PER_PAGE);

  const currentBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return bookmarks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [bookmarks, currentPage]);

  return (
    <div className="space-y-8">
      <header className='flex items-end justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-white tracking-tight'>常用收藏</h1>
          <p className='text-slate-400 mt-1'>工具、灵感与常用链接。</p>
        </div>
      </header>

      {bookmarks.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-dashed">
          <p className="text-white/30">暂无收藏。</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBookmarks.map((bm, i) => (
              <motion.a
                key={bm.id}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 rounded-2xl flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Bookmark className="w-4 h-4 text-white/70 group-hover:text-white" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
                <h3 className="font-semibold text-white/90 mb-2 truncate">{bm.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mt-auto">
                  {bm.description}
                </p>
              </motion.a>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full glass border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="上一页"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      currentPage === i + 1
                        ? "bg-indigo-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full glass border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="下一页"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
