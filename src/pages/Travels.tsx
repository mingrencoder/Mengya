import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { MapPin, X, ChevronLeft, ChevronRight, Search, Calendar, Filter, ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Travels() {
  const { data, loading } = useData();
  const [selectedTravel, setSelectedTravel] = useState<any>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Extract filter options
  const filterOptions = useMemo(() => {
    if (!data?.travels) return { years: [], quarters: [], months: [], locations: [] };
    
    const years = new Set<string>();
    const quarters = new Set<string>();
    const months = new Set<string>();
    const locations = new Set<string>();

    data.travels.forEach(t => {
      if (t.location) locations.add(t.location);
      
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear().toString();
        years.add(y);
        
        // Collect quarters and months based on year selection
        if (!selectedYear || selectedYear === y) {
          const m = d.getMonth() + 1;
          const q = Math.ceil(m / 3).toString();
          quarters.add(q);
          
          if (!selectedQuarter || selectedQuarter === q) {
            months.add(m.toString().padStart(2, '0'));
          }
        }
      }
    });

    return {
      years: Array.from(years).sort().reverse(),
      quarters: Array.from(quarters).sort(),
      months: Array.from(months).sort(),
      locations: Array.from(locations).sort()
    };
  }, [data?.travels, selectedYear, selectedQuarter]);

  // Handle year change
  const handleYearChange = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedQuarter(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedQuarter(null);
      setSelectedMonth(null);
    }
  };

  // Handle quarter change
  const handleQuarterChange = (quarter: string) => {
    if (selectedQuarter === quarter) {
      setSelectedQuarter(null);
      setSelectedMonth(null);
    } else {
      setSelectedQuarter(quarter);
      setSelectedMonth(null);
    }
  };

  // Handle location toggle
  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  // Locations to display in filter (filtered by search)
  const displayLocations = useMemo(() => {
    return filterOptions.locations.filter(loc => 
      loc.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [filterOptions.locations, locationSearch]);

  // Filtered travels
  const filteredTravels = useMemo(() => {
    if (!data?.travels) return [];
    
    return data.travels.filter(t => {
      // Title search (fuzzy)
      const matchesSearch = searchQuery 
        ? t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.location?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      // Date filtering
      let matchesYear = true;
      let matchesQuarter = true;
      let matchesMonth = true;
      
      if (selectedYear || selectedQuarter || selectedMonth) {
        const d = new Date(t.date);
        const isValidDate = !isNaN(d.getTime());
        if (isValidDate) {
          const y = d.getFullYear().toString();
          const m = (d.getMonth() + 1);
          const q = Math.ceil(m / 3).toString();
          const mStr = m.toString().padStart(2, '0');

          if (selectedYear) matchesYear = y === selectedYear;
          if (selectedQuarter) matchesQuarter = q === selectedQuarter;
          if (selectedMonth) matchesMonth = mStr === selectedMonth;
        } else {
          matchesYear = false; 
          matchesQuarter = false;
          matchesMonth = false;
        }
      }

      // Location filtering
      const matchesLocation = selectedLocations.length > 0 
        ? selectedLocations.includes(t.location)
        : true;

      return matchesSearch && matchesYear && matchesQuarter && matchesMonth && matchesLocation;
    }).sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [data?.travels, searchQuery, selectedYear, selectedQuarter, selectedMonth, selectedLocations, sortOrder]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedQuarter, selectedMonth, selectedLocations]);

  const totalPages = Math.ceil(filteredTravels.length / ITEMS_PER_PAGE);

  const paginatedTravels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTravels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTravels, currentPage]);

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />;

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
    <div className="space-y-6">
      <header className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white tracking-tight'>旅行记录</h1>
          <p className='text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2'>
            <span>记录在世界各地的足迹。</span>
            <span className="text-slate-700 dark:text-white/20">|</span>
            <span>共 {filteredTravels.length} 条记录</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative relative-group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="搜索标题或地点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-200/50 dark:focus:bg-white/10 transition-all w-full md:w-64"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center p-2 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-medium"
            title={sortOrder === 'desc' ? '当前：从新到旧 (点击切换)' : '当前：从旧到新 (点击切换)'}
          >
            {sortOrder === 'desc' ? <ArrowDownWideNarrow className="w-4 h-4" /> : <ArrowUpNarrowWide className="w-4 h-4" />}
          </button>
          
          <div className="flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === 'grid' 
                  ? "bg-white dark:bg-white/10 text-indigo-500 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === 'timeline' 
                  ? "bg-white dark:bg-white/10 text-indigo-500 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="时间轴视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              showFilters || selectedYear || selectedQuarter || selectedMonth || selectedLocations.length > 0
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
            {(selectedYear || selectedQuarter || selectedMonth || selectedLocations.length > 0) && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] ml-1">
                {(selectedYear ? 1 : 0) + (selectedQuarter ? 1 : 0) + (selectedMonth ? 1 : 0) + (selectedLocations.length > 0 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-5 rounded-2xl mb-6 space-y-4 border border-white/10">
              
              {/* Year Filter */}
              {filterOptions.years.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    按年度
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.years.map(year => (
                      <button
                        key={year}
                        onClick={() => handleYearChange(year)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          selectedYear === year 
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        {year}年
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quarter Filter */}
              {selectedYear && filterOptions.quarters.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    按季度
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.quarters.map(quarter => (
                      <button
                        key={quarter}
                        onClick={() => handleQuarterChange(quarter)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          selectedQuarter === quarter 
                            ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        第{quarter}季度
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Month Filter */}
              {selectedYear && filterOptions.months.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    按月度
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.months.map(month => (
                      <button
                        key={month}
                        onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          selectedMonth === month 
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
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
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      按地点 (多选)
                    </div>
                    {/* Location Search Input */}
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="搜索地点..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-1 pl-7 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 w-32 md:w-48 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2 pb-1">
                    {displayLocations.map(loc => {
                      const isSelected = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          onClick={() => toggleLocation(loc)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-all border",
                            isSelected 
                              ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" 
                              : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10"
                          )}
                        >
                          {loc}
                        </button>
                      );
                    })}
                    {displayLocations.length === 0 && (
                      <span className="text-xs text-slate-500 italic py-1">未找到匹配地点</span>
                    )}
                  </div>
                  {/* Selected Locations Tags */}
                  {selectedLocations.length > 0 && (
                    <div className="flex flex-wrap text-xs gap-1 mt-2">
                       <span className="text-slate-500 content-center mr-1">已选：</span>
                       {selectedLocations.map(loc => (
                         <span key={loc} className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                           {loc}
                           <button onClick={() => toggleLocation(loc)} className="hover:text-indigo-100 rounded-full p-0.5">
                             <X className="w-2.5 h-2.5" />
                           </button>
                         </span>
                       ))}
                       <button onClick={() => setSelectedLocations([])} className="text-slate-400 hover:text-white px-2 py-0.5 ml-1 transition-colors">
                         清除地点
                       </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reset All Filters */}
              {(selectedYear || selectedQuarter || selectedMonth || selectedLocations.length > 0) && (
                <div className="pt-3 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedYear(null);
                      setSelectedQuarter(null);
                      setSelectedMonth(null);
                      setSelectedLocations([]);
                      setLocationSearch('');
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
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

      {filteredTravels.length === 0 ? (
        <div className="py-20 text-center glass rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-400 dark:text-white/40">没找到符合条件的旅行记录，换个搜索词或筛选条件试试吧。</p>
          {(searchQuery || selectedYear || selectedQuarter || selectedMonth || selectedLocations.length > 0) && (
             <button
               onClick={() => {
                 setSearchQuery('');
                 setSelectedYear(null);
                 setSelectedQuarter(null);
                 setSelectedMonth(null);
                 setSelectedLocations([]);
                 setLocationSearch('');
               }}
               className="mt-4 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition-colors"
             >
               清除搜索和筛选
             </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'timeline' ? (
            <div className="relative py-8">
              {/* Desktop Quick Nav Scrubber */}
              <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-md py-4 px-2 rounded-full border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-[10px] text-slate-400 font-mono mb-2" style={{ writingMode: 'vertical-rl' }}>TIMELINE</div>
                {paginatedTravels.map((travel, i) => (
                  <button 
                    key={`nav-${travel.id}`}
                    onClick={() => {
                      document.getElementById(`timeline-item-${travel.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/20 hover:bg-indigo-500 dark:hover:bg-indigo-400 hover:shadow-[0_0_8px_#6366f1] transition-all duration-300 group/nav relative"
                    aria-label={`Jump to ${travel.date}`}
                  >
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/nav:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">
                      {travel.date}
                    </span>
                  </button>
                ))}
              </div>

              {/* Centered Line */}
              <div className="absolute inset-y-0 left-[24px] md:left-1/2 w-[2px] bg-slate-200 dark:bg-white/10 md:-translate-x-1/2 rounded-full" />

              <div className="space-y-12">
                {paginatedTravels.map((travel, i) => {
                  const coverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
                  const isLeft = i % 2 !== 0; // Alternating logic: Even index -> right side (md:flex-row is default, card is in 2nd slot), Odd index -> left side
                  
                  return (
                    <motion.div
                      id={`timeline-item-${travel.id}`}
                      key={`timeline-${travel.id}`}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                      className={cn(
                        "relative flex flex-col md:flex-row items-center",
                        isLeft ? "md:flex-row-reverse" : ""
                      )}
                    >
                      {/* Empty Space for alignment on Desktop */}
                      <div className="hidden md:block md:w-1/2" />
                      
                      {/* Glowing Point */}
                      <div className="absolute left-[24px] md:left-1/2 top-10 md:top-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_#6366f1] -translate-x-[5px] md:-translate-x-1/2 -translate-y-1/2 z-10 animate-pulse border-2 border-white dark:border-[#0f172a]" />

                      {/* Card Container */}
                      <div className={cn(
                        "w-full pl-12 md:pl-0 md:w-1/2 flex",
                        isLeft ? "md:pr-12 justify-end" : "md:pl-12 justify-start"
                      )}>
                        {/* 缩小为约1/3 */}
                        <div className="w-full md:w-[85%] lg:w-[70%] xl:w-[60%] bg-white/50 dark:bg-white/[0.02] backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/10 p-3 md:p-5 hover:bg-white/80 dark:hover:bg-white/[0.04] transition-all duration-300 shadow-xl shadow-black/5 hover:-translate-y-1 group">
                          
                          {coverImage && (
                            <div 
                              className="relative w-full rounded-xl md:rounded-2xl overflow-hidden mb-4 cursor-pointer max-h-[250px]"
                              onClick={() => openLightbox(travel)}
                            >
                              <div className="absolute inset-0 border border-slate-200/50 dark:border-white/5 z-10 pointer-events-none rounded-xl md:rounded-2xl"></div>
                              <img 
                                src={coverImage} 
                                alt={travel.location}
                                className="w-full h-full max-h-[250px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                loading="lazy"
                              />
                              {travel.imageUrls && travel.imageUrls.length > 1 && (
                                <div className="absolute bottom-2 right-2 glass px-2 py-1 rounded-full text-[10px] font-medium text-slate-900 dark:text-white z-20 flex items-center gap-1 shadow-md backdrop-blur-md bg-white/80 dark:bg-black/40">
                                  +{travel.imageUrls.length - 1}图
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                              {travel.title || travel.location}
                            </h3>
                            
                            {travel.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 md:line-clamp-none">
                                {travel.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                {travel.date}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium tracking-wide bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                <MapPin className="w-3 h-3" />
                                {travel.location}
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedTravels.map((travel, i) => {
                const coverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
              
              return (
                <motion.div
                  key={travel.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layoutId={`card-${travel.id}`}
                  className="glass rounded-2xl p-4 flex flex-col group relative"
                >
                  {coverImage && (
                    <div 
                      className="h-32 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden cursor-pointer"
                      onClick={() => openLightbox(travel)}
                    >
                      <div className="absolute inset-0 border border-white/5 z-10 pointer-events-none"></div>
                      <img 
                        src={coverImage} 
                        alt={travel.location}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className='absolute top-2 right-2 glass px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-200 dark:border-white/10 z-20 text-slate-900 dark:text-white shadow-sm bg-white/80 dark:bg-black/30 backdrop-blur-md'>
                        {travel.date}
                      </div>
                      {travel.imageUrls && travel.imageUrls.length > 1 && (
                         <div className="absolute bottom-2 right-2 glass px-1.5 py-0.5 rounded-full text-[10px] font-medium text-slate-900 dark:text-white z-20 flex items-center gap-1 shadow-md backdrop-blur-md bg-white/80 dark:bg-black/40">
                           +{travel.imageUrls.length - 1}图
                         </div>
                      )}
                    </div>
                  )}
                  {!coverImage && (
                    <div className='absolute top-3 right-3 glass px-1.5 py-0.5 rounded text-[9px] font-mono border border-slate-200 dark:border-white/10 z-20 text-slate-900 dark:text-white shadow-sm bg-white/50 dark:bg-white/5'>
                      {travel.date}
                    </div>
                  )}
                  <div className="flex-1 mt-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1" title={travel.title || travel.location}>{travel.title || travel.location}</h3>
                    {travel.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2" title={travel.description}>
                        {travel.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-1 rounded-md max-w-[200px]" title={travel.location}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{travel.location}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-full glass border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="上一页"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                   // Show subset of pages for compact view if many pages
                   if (totalPages > 7 && i !== 0 && i !== totalPages - 1 && Math.abs(i + 1 - currentPage) > 1) {
                     if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) return <span key={i} className="text-slate-500">...</span>;
                     return null;
                   }
                   return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        currentPage === i + 1
                          ? "bg-indigo-500 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {i + 1}
                    </button>
                   );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-full glass border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="下一页"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
                className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-white transition-colors z-50"
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

