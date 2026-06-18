import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { MapPin, X, ChevronLeft, ChevronRight, Search, Calendar, Filter, ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, List, Images, BookOpen, Tag, Star, Lock, Eye, EyeOff, Sparkles, Crown, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Keyboard, Mousewheel, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/free-mode';

export function Travels() {
  const { data, loading, refresh } = useData();
  const [selectedTravel, setSelectedTravel] = useState<any>(null);
  const [selectedDescription, setSelectedDescription] = useState<any>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const isAdmin = useMemo(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      try {
        const base64Url = adminToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        if (payload.exp * 1000 > Date.now()) return true;
      } catch (e) {}
    }
    return false;
  }, []);
  const [travelToken, setTravelToken] = useState(localStorage.getItem('travel_token'));
  const [showPassword, setShowPassword] = useState(false);
  
  const isLocked = data && data.isTravelAuthorized === false;
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        setTravelToken(token);
      } else {
        setLoginError('密码错误');
      }
    } catch (e) {
      setLoginError('登录失败');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'gallery' | 'story' | 'matrix'>('grid');
  const [coverFlowIndex, setCoverFlowIndex] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [inputItemsPerPage, setInputItemsPerPage] = useState('20');

  React.useEffect(() => {
    setInputItemsPerPage(String(itemsPerPage));
  }, [itemsPerPage]);

  const handleItemsPerPageBlur = () => {
    let val = parseInt(inputItemsPerPage, 10);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 100) val = 100;
    if (val !== itemsPerPage) {
      setItemsPerPage(val);
      setCurrentPage(1);
    }
    setInputItemsPerPage(String(val));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputItemsPerPage(e.target.value.replace(/\D/g, ''));
  };

  const handleItemsPerPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Reset cover flow index when pagination or filters change
  React.useEffect(() => {
    setCoverFlowIndex(0);
  }, [currentPage, itemsPerPage, searchQuery, selectedYear, selectedQuarter, selectedMonth, startDate, endDate, selectedLocations, selectedTags, showBookmarkedOnly]);

  // Extract filter options
  const filterOptions = useMemo(() => {
    if (!data?.travels) return { years: [], quarters: [], months: [], locations: [], tags: [] };
    
    const years = new Set<string>();
    const quarters = new Set<string>();
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
      locations: Array.from(locations).sort(),
      tags: Array.from(tags).sort()
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

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
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
      // Title/Tag search (fuzzy)
      const matchesSearch = searchQuery 
        ? t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

      if (startDate && t.date < startDate) {
         matchesYear = false;
      }
      if (endDate && t.date > endDate) {
         matchesYear = false;
      }

      // Location filtering
      const matchesLocation = selectedLocations.length > 0 
        ? selectedLocations.includes(t.location)
        : true;

      // Tags filtering
      const matchesTags = selectedTags.length > 0
        ? selectedTags.every(tag => t.tags?.includes(tag))
        : true;

      // Bookmarked filtering
      const matchesBookmarked = showBookmarkedOnly ? t.bookmarked === true : true;

      return matchesSearch && matchesYear && matchesQuarter && matchesMonth && matchesLocation && matchesTags && matchesBookmarked;
    }).sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [data?.travels, searchQuery, selectedYear, selectedQuarter, selectedMonth, startDate, endDate, selectedLocations, selectedTags, showBookmarkedOnly, sortOrder]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchQuery, selectedYear, selectedQuarter, selectedMonth, startDate, endDate, selectedLocations, selectedTags, showBookmarkedOnly]);

  const totalPages = Math.ceil(filteredTravels.length / itemsPerPage);

  const paginatedTravels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTravels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTravels, currentPage, itemsPerPage]);

  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);
  const touchStartTime = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const timeTaken = Date.now() - (touchStartTime.current || 0);
    const velocity = Math.abs(distance / Math.max(timeTaken, 1));
    
    let shift = 0;
    // Lower threshold so slower swipes still work. Use swipe velocity for fast jumps
    if (distance > 30) {
      shift = velocity > 1 ? 2 : 1;
    } else if (distance < -30) {
      shift = velocity > 1 ? -2 : -1;
    }

    if (shift !== 0) {
      setCoverFlowIndex(prev => {
        const next = Math.max(0, Math.min(prev + shift, paginatedTravels.length - 1));
        return next;
      });
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartTime.current = null;
  };

  React.useEffect(() => {
    if (viewMode !== 'gallery') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCoverFlowIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
         setCoverFlowIndex(prev => Math.min(paginatedTravels.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, paginatedTravels.length]);

  const footprintNodes = useMemo(() => {
    if (!data?.travels) return [];
    const aggregated = data.travels.reduce((acc: any, curr: any) => {
      if (!acc[curr.location]) {
        acc[curr.location] = { name: curr.location, count: 0, bookmarked: false, lastDate: curr.date, records: [] };
      }
      acc[curr.location].count += 1;
      acc[curr.location].records.push(curr);
      if (curr.bookmarked) acc[curr.location].bookmarked = true;
      if (new Date(curr.date) > new Date(acc[curr.location].lastDate)) {
        acc[curr.location].lastDate = curr.date;
      }
      return acc;
    }, {});
    return Object.values(aggregated).sort((a: any, b: any) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.bookmarked ? 1 : 0) - (a.bookmarked ? 1 : 0);
    });
  }, [data?.travels]);

  if (loading || !data) return <div className="animate-pulse flex h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />;

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="glass p-8 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl flex flex-col items-center">
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
                   className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                   placeholder="请输入时光密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && <p className="text-red-500 text-xs px-1">{loginError}</p>}
              <button 
                type="submit" 
                disabled={!password || isLoggingIn} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
                >
                解锁
              </button>
           </form>
        </div>
      </div>
    );
  }

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
      <div className="relative md:sticky -top-8 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md pt-8 pb-4 border-b border-transparent transition-all">
        <div className="max-w-6xl mx-auto">
          <header className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6'>
        <div>
          <div className="flex items-center gap-3">
            <h1 className='text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center'>
              旅行记录
              <button
                onClick={() => setViewMode(prev => prev === 'matrix' ? 'grid' : 'matrix')}
                className={cn(
                  "ml-4 p-2 rounded-full transition-all flex items-center justify-center",
                  viewMode === 'matrix' 
                    ? "bg-indigo-500/10 text-indigo-500 shadow-sm" 
                    : "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
                )}
                title="拾光星阵"
              >
                <Sparkles className="w-6 h-6" />
              </button>
            </h1>
          </div>
          <p className='text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2'>
            <span>记录在世界各地的足迹。</span>
            <span className="text-slate-700 dark:text-white/20">|</span>
            <span>共 {filteredTravels.length} 条记录</span>
          </p>
        </div>
        
        {viewMode !== 'matrix' ? (
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
              <button
                onClick={() => setViewMode('gallery')}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  viewMode === 'gallery' 
                    ? "bg-white dark:bg-white/10 text-indigo-500 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
                title="3D 画廊视图"
              >
                <Images className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('story')}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  viewMode === 'story' 
                    ? "bg-white dark:bg-white/10 text-indigo-500 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
                title="分屏叙事视图"
              >
                <BookOpen className="w-4 h-4" />
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
                  {(selectedYear ? 1 : 0) + (selectedQuarter ? 1 : 0) + (selectedMonth ? 1 : 0) + (startDate || endDate ? 1 : 0) + (selectedLocations.length > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all text-sm font-medium shadow-sm border border-slate-200 dark:border-white/10"
            >
              <LayoutGrid className="w-4 h-4" />
              退出星阵
            </button>
          </div>
        )}
      </header>

      <AnimatePresence>
        {showFilters && viewMode !== 'matrix' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-4 rounded-xl mb-4 space-y-3 border border-white/10 text-sm shadow-sm relative">
              
              {/* Row 1: Time (Year, Quarter, Month, and Custom Date Range) */}
              <div className="flex flex-wrap items-center gap-4">
                 
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 w-10 shrink-0">时间段</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md py-1 px-2 text-xs focus:outline-none focus:border-indigo-500/50"
                      style={{ colorScheme: 'dark' }}
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md py-1 px-2 text-xs focus:outline-none focus:border-indigo-500/50"
                      style={{ colorScheme: 'dark' }}
                    />
                 </div>

                 {/* Year */}
                 {filterOptions.years.length > 0 && (
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-semibold text-slate-400 w-10 shrink-0">年度</span>
                       <div className="flex flex-wrap gap-1">
                         {filterOptions.years.map(year => (
                           <button
                             key={year}
                             onClick={() => handleYearChange(year)}
                             className={cn(
                               "px-2.5 py-1 rounded-md text-xs transition-all border border-transparent",
                               selectedYear === year 
                                 ? "bg-indigo-500/20 text-indigo-500 font-bold border-indigo-500/50" 
                                 : "bg-white/5 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                             )}
                           >
                             {year}年
                           </button>
                         ))}
                       </div>
                    </div>
                 )}

                 {/* Quarter */}
                 {selectedYear && filterOptions.quarters.length > 0 && (
                    <div className="flex items-center gap-2 md:border-l md:border-slate-300 md:dark:border-white/10 md:pl-4">
                       <span className="text-xs font-semibold text-slate-400 w-10 shrink-0">季度</span>
                       <div className="flex flex-wrap gap-1">
                         {filterOptions.quarters.map(quarter => (
                           <button
                             key={quarter}
                             onClick={() => handleQuarterChange(quarter)}
                             className={cn(
                               "px-2.5 py-1 rounded-md text-xs transition-all border border-transparent",
                               selectedQuarter === quarter 
                                 ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold border-teal-500/50" 
                                 : "bg-white/5 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                             )}
                           >
                             第{quarter}季度
                           </button>
                         ))}
                       </div>
                    </div>
                 )}

                 {/* Month */}
                 {selectedYear && filterOptions.months.length > 0 && (
                    <div className="flex items-center gap-2 md:border-l md:border-slate-300 md:dark:border-white/10 md:pl-4">
                       <span className="text-xs font-semibold text-slate-400 w-10 shrink-0">月度</span>
                       <div className="flex flex-wrap gap-1">
                         {filterOptions.months.map(month => (
                           <button
                             key={month}
                             onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                             className={cn(
                               "px-2.5 py-1 rounded-md text-xs transition-all border border-transparent",
                               selectedMonth === month 
                                 ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold border-purple-500/50" 
                                 : "bg-white/5 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                             )}
                           >
                             {month}月
                           </button>
                         ))}
                       </div>
                    </div>
                 )}
              </div>

              {/* Row 2: Location, Tag, Favorite */}
              <div className="flex flex-wrap items-start gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                 {/* Locations */}
                 {filterOptions.locations.length > 0 && (
                    <div className="flex items-start gap-2 flex-1 min-w-[200px]">
                       <span className="text-xs font-semibold text-slate-400 w-10 shrink-0 pt-1.5">地点</span>
                       <div className="flex-1 flex flex-col gap-2">
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              placeholder="搜索地点..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md py-1 pl-6 pr-2 text-xs w-full max-w-[120px] focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {displayLocations.map(loc => {
                              const isSelected = selectedLocations.includes(loc);
                              return (
                                <button
                                  key={loc}
                                  onClick={() => toggleLocation(loc)}
                                  className={cn(
                                    "px-2 py-1 rounded text-[10px] font-medium transition-all border",
                                    isSelected 
                                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/50" 
                                      : "bg-white/5 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                                  )}
                                >
                                  {loc}
                                </button>
                              );
                            })}
                            {displayLocations.length === 0 && <span className="text-xs text-slate-500">无记录</span>}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Tags */}
                 {filterOptions.tags && filterOptions.tags.length > 0 && (
                    <div className="flex items-start gap-2 flex-1 min-w-[200px] md:border-l md:border-slate-300 md:dark:border-white/10 md:pl-4">
                       <span className="text-xs font-semibold text-slate-400 w-10 shrink-0 pt-1.5">标签</span>
                       <div className="flex-1 flex flex-col gap-2">
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              placeholder="搜索标签..."
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
                              className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md py-1 pl-6 pr-2 text-xs w-full max-w-[120px] focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {filterOptions.tags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => {
                              const isSelected = selectedTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={cn(
                                    "px-2 py-1 rounded text-[10px] font-medium transition-all border",
                                    isSelected 
                                      ? "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/50" 
                                      : "bg-white/5 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                                  )}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Bookmark Toggle */}
                 <div className="flex flex-col gap-3 md:border-l md:border-slate-300 md:dark:border-white/10 md:pl-4 min-w-[120px]">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                      <Star className="w-3 h-3" /> 其他
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showBookmarkedOnly}
                        onChange={(e) => setShowBookmarkedOnly(e.target.checked)}
                        className="rounded border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/20 w-4 h-4 text-indigo-500 focus:ring-indigo-500/50 transition-colors"
                      />
                      只显示收藏记录
                    </label>

                    {(selectedYear || selectedQuarter || selectedMonth || startDate || endDate || selectedLocations.length > 0 || selectedTags.length > 0 || showBookmarkedOnly) && (
                       <button 
                         onClick={() => {
                           setSelectedYear(null);
                           setSelectedQuarter(null);
                           setSelectedMonth(null);
                           setStartDate('');
                           setEndDate('');
                           setSelectedLocations([]);
                           setSelectedTags([]);
                           setShowBookmarkedOnly(false);
                           setLocationSearch('');
                           setTagSearch('');
                         }} 
                         className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded flex items-center justify-center gap-1 mt-2 border border-red-500/20 max-w-fit"
                       >
                          <X className="w-2.5 h-2.5" /> 重置筛选
                       </button>
                    )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>

      {filteredTravels.length === 0 ? (
        <div className="py-20 text-center glass rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-400 dark:text-white/40">没找到符合条件的旅行记录，换个搜索词或筛选条件试试吧。</p>
          {(searchQuery || selectedYear || selectedQuarter || selectedMonth || startDate || endDate || selectedLocations.length > 0) && (
             <button
               onClick={() => {
                 setSearchQuery('');
                 setSelectedYear(null);
                 setSelectedQuarter(null);
                 setSelectedMonth(null);
                 setStartDate('');
                 setEndDate('');
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
          {viewMode === 'timeline' && (
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
                  const rawCoverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
                  const coverImage = rawCoverImage && !failedImages[travel.id] ? rawCoverImage : null;
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
                                onError={() => setFailedImages(prev => ({ ...prev, [travel.id]: true }))}
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
                            
                            {(travel.description || travel.externalLink) && (
                              <div className="mt-3 flex flex-wrap gap-2 items-center">
                                {travel.description && (
                                  <button
                                    onClick={() => setSelectedDescription(travel)}
                                    className="w-fit px-2.5 py-1.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium rounded-lg transition-all text-[11px] flex items-center gap-1.5"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>详情描述</span>
                                  </button>
                                )}
                                {travel.externalLink && (
                                  <a 
                                    href={travel.externalLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-fit px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 shadow-sm border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg transition-all text-[11px] flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{travel.externalLinkText || '查看详情'}</span>
                                  </a>
                                )}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                              <div className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                                {travel.date}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium tracking-wide bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                <MapPin className="w-3 h-3" />
                                {travel.location}
                              </div>
                              {travel.bookmarked && (
                                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium tracking-wide bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-500/20">
                                  <Star className="w-3 h-3" /> 收藏
                                </div>
                              )}
                              {travel.tags && travel.tags.length > 0 && travel.tags.map(tag => (
                                <div key={tag} className="flex items-center gap-1 text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-medium bg-fuchsia-50 dark:bg-fuchsia-500/10 px-1.5 py-0.5 rounded-md border border-fuchsia-100 dark:border-fuchsia-500/20">
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {paginatedTravels.map((travel, i) => {
                const rawCoverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
                const coverImage = rawCoverImage && !failedImages[travel.id] ? rawCoverImage : null;
              
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
                        onError={() => setFailedImages(prev => ({ ...prev, [travel.id]: true }))}
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
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1" title={travel.title || travel.location}>{travel.title || travel.location}</h3>
                      {travel.bookmarked && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5 fill-yellow-500" />}
                    </div>
                  </div>
                  
                  {(travel.description || travel.externalLink) && (
                    <div className="mt-2 flex flex-row flex-wrap items-center gap-1.5 px-1">
                      {travel.description && (
                        <button
                          onClick={() => setSelectedDescription(travel)}
                          className="flex-1 text-center px-1.5 py-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-medium transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-white/10"
                        >
                          <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">详情</span>
                        </button>
                      )}
                      {travel.externalLink && (
                        <a 
                          href={travel.externalLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 text-center px-1.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-medium transition-colors flex items-center justify-center gap-1 border border-indigo-200 dark:border-indigo-500/30"
                        >
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{travel.externalLinkText || '链接'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-indigo-500 dark:text-indigo-400 font-bold w-fit bg-indigo-500/10 px-1.5 py-1 rounded-md max-w-full" title={travel.location}>
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{travel.location}</span>
                    </div>
                    {travel.tags && travel.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {travel.tags.map(tag => (
                          <span key={tag} className="text-[9px] text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            </div>
          )}

          {viewMode === 'gallery' && (
            <div 
              className="flex flex-col items-center py-4 mt-2 min-h-[460px] overflow-hidden select-none outline-none target-gallery no-tap-highlight"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-full max-w-5xl h-[340px] md:h-[400px] flex items-center justify-center pointer-events-none" style={{ perspective: '1200px' }}>
                {paginatedTravels.map((travel, index) => {
                  const offset = index - coverFlowIndex;
                  const absOffset = Math.abs(offset);
                  const zIndex = 50 - absOffset;
                  const scale = 1 - Math.min(absOffset * 0.15, 0.6);
                  const translateX = offset * 45; // 45% shift
                  const rotateY = offset === 0 ? 0 : offset > 0 ? -25 : 25;
                  const translateZ = absOffset * -100;
                  
                  const opacity = 1 - Math.min(absOffset * 0.3, 0.8);
                  const blur = absOffset > 0 ? `${absOffset * 2}px` : '0px';

                  const rawCoverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
                  const coverImage = rawCoverImage && !failedImages[travel.id] ? rawCoverImage : null;
                  const pointerEvents = absOffset <= 2 ? 'auto' : 'none';

                  return (
                    <div 
                      key={`gallery-${travel.id}`}
                      onClick={() => {
                        if (offset === 0) {
                          openLightbox(travel);
                        } else {
                          setCoverFlowIndex(index);
                        }
                      }}
                      className={cn(
                        "absolute transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
                        offset === 0 ? "cursor-pointer" : "cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 border-white/10"
                      )}
                      style={{
                        zIndex,
                        transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        opacity,
                        filter: `blur(${blur})`,
                        width: '100%',
                        maxWidth: '720px',
                        aspectRatio: '16/9',
                        pointerEvents,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                       <div className="w-full h-full bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/10 flex flex-col shadow-2xl relative group">
                          {coverImage ? (
                            <img src={coverImage} alt={travel.location} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105 pointer-events-none" draggable={false} loading="lazy" onError={() => setFailedImages(prev => ({ ...prev, [travel.id]: true }))} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 bg-white/5 pointer-events-none">暂无图片</div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none z-10 text-center md:text-left">
                             <div className="font-mono text-xs text-indigo-400 mb-2 drop-shadow-md">{travel.date}</div>
                             <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">{travel.title || travel.location}</h3>
                             <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-white/80 text-sm font-medium">
                                <MapPin className="w-4 h-4 text-indigo-400" /> {travel.location}
                             </div>
                          </div>
                          {travel.imageUrls && travel.imageUrls.length > 1 && (
                            <div className="absolute top-4 right-4 glass px-2 py-1 rounded-full text-[10px] font-medium text-white z-20 flex items-center gap-1 shadow-md backdrop-blur-md bg-black/40 border border-white/10">
                              +{travel.imageUrls.length - 1}图
                            </div>
                          )}
                       </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-12 flex flex-col items-center gap-6 max-w-2xl px-6 w-full z-20">
                 <div className="flex items-center gap-6">
                   <button 
                     onClick={() => setCoverFlowIndex(prev => Math.max(prev - 1, 0))}
                     disabled={coverFlowIndex === 0}
                     className="w-12 h-12 rounded-full glass border border-white/10 shadow-lg backdrop-blur-xl bg-white/5 flex items-center justify-center text-slate-300 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                   <div className="text-slate-500 dark:text-slate-400 font-mono text-sm tracking-widest">
                     {String(coverFlowIndex + 1).padStart(2, '0')} / {String(paginatedTravels.length).padStart(2, '0')}
                   </div>
                   <button 
                     onClick={() => setCoverFlowIndex(prev => Math.min(prev + 1, paginatedTravels.length - 1))}
                     disabled={coverFlowIndex === paginatedTravels.length - 1}
                     className="w-12 h-12 rounded-full glass border border-white/10 shadow-lg backdrop-blur-xl bg-white/5 flex items-center justify-center text-slate-300 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                   >
                     <ChevronRight className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <AnimatePresence mode="wait">
                   {(paginatedTravels[coverFlowIndex]?.description || paginatedTravels[coverFlowIndex]?.externalLink) && (
                     <motion.div 
                       key={`desc-${paginatedTravels[coverFlowIndex]?.id}`}
                       initial={{ opacity: 0, y: 5 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -5 }}
                       className="w-full flex flex-col items-center justify-center mt-2 mx-auto max-w-sm"
                     >
                       <div className="flex flex-row flex-wrap items-center justify-center gap-1.5">
                         {paginatedTravels[coverFlowIndex].description && (
                           <button
                             onClick={() => setSelectedDescription(paginatedTravels[coverFlowIndex])}
                             className="px-2.5 py-1 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium rounded-lg transition-all text-[11px] flex items-center justify-center gap-1 shadow-sm"
                           >
                             <BookOpen className="w-3 h-3 flex-shrink-0" />
                             <span>详情描述</span>
                           </button>
                         )}
                         {paginatedTravels[coverFlowIndex].externalLink && (
                           <a 
                             href={paginatedTravels[coverFlowIndex].externalLink} 
                             target="_blank" 
                             rel="noreferrer" 
                             className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg transition-all text-[11px] flex items-center justify-center gap-1 shadow-sm"
                           >
                             <ExternalLink className="w-3 h-3 flex-shrink-0" />
                             <span>{paginatedTravels[coverFlowIndex].externalLinkText || '外链跳转'}</span>
                           </a>
                         )}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </div>
          )}

          {viewMode === 'story' && (
             <div className="space-y-16 md:space-y-0 py-8 md:py-16 max-w-6xl mx-auto">
                {paginatedTravels.map((travel, index) => {
                   const rawCoverImage = (travel.imageUrls && travel.imageUrls[travel.coverImageIndex || 0]) || travel.imageUrl;
                   const coverImage = rawCoverImage && !failedImages[travel.id] ? rawCoverImage : null;
                   return (
                      <div key={`story-${travel.id}`} className="flex flex-col md:flex-row gap-8 md:gap-16 items-start relative min-h-[60vh] border-b border-slate-200 dark:border-white/5 pb-16 md:pb-32 md:py-24 last:border-0 last:pb-0 pt-0 first:pt-0">
                         {/* Left: Sticky Text */}
                         <div className="w-full md:w-5/12 md:sticky md:top-[25vh] flex flex-col gap-6 z-10 transition-all duration-500 pt-4 md:pt-0">
                            <div className="font-mono text-7xl md:text-[8rem] leading-[0.8] font-black text-slate-200 dark:text-white/[0.03] -mb-8 md:-mb-14 pointer-events-none select-none tracking-tighter">
                              {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                            </div>
                            <div className="relative">
                              <h2 className="text-3xl md:text-5xl font-extrabold text-[#0a0a0a] dark:text-white tracking-tight leading-tight">
                                 {travel.title || travel.location}
                              </h2>
                              <div className="flex flex-wrap items-center gap-3 mt-5 text-sm font-medium">
                                 <span className="font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">{travel.date}</span>
                                 <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                                    <MapPin className="w-4 h-4 text-slate-500" /> {travel.location}
                                 </span>
                              </div>
                            </div>
                            {(travel.description || travel.externalLink) && (
                              <div className="mt-4 flex flex-wrap gap-2 items-center">
                                {travel.description && (
                                  <button
                                    onClick={() => setSelectedDescription(travel)}
                                    className="px-3 py-1.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-medium rounded-lg transition-all text-[11px] flex items-center gap-1.5 border border-slate-200 dark:border-white/10 shadow-sm"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>阅读详情说明</span>
                                  </button>
                                )}
                                {travel.externalLink && (
                                  <a 
                                    href={travel.externalLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg transition-all text-[11px] flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{travel.externalLinkText || '查看外链'}</span>
                                  </a>
                                )}
                              </div>
                            )}
                         </div>

                         {/* Right: Images */}
                         <div className="w-full md:w-7/12">
                             <div 
                                className="rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-2 md:p-3 relative shadow-xl dark:shadow-2xl group cursor-pointer hover:border-indigo-500/30 transition-colors duration-500"
                                onClick={() => openLightbox(travel)}
                             >
                               {/* Glass Badge Apple style */}
                               <div className="absolute top-6 right-6 z-20 glass px-4 py-2 rounded-xl backdrop-blur-xl bg-white/70 dark:bg-[#0a0a0a]/60 border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-white/90 font-mono">
                                     {new Date(travel.date).getFullYear() || travel.location}
                                  </span>
                               </div>
                               <div className="rounded-[1.5rem] overflow-hidden relative bg-slate-100 dark:bg-[#0a0a0a]">
                                 {coverImage ? (
                                    <img 
                                       src={coverImage} 
                                       alt={travel.location} 
                                       className="w-full h-auto min-h-[300px] md:min-h-[500px] object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                                       loading="lazy"
                                       onError={() => setFailedImages(prev => ({ ...prev, [travel.id]: true }))}
                                    />
                                 ) : (
                                    <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center text-slate-400 dark:text-white/30">
                                       暂无图片
                                    </div>
                                 )}
                                 {travel.imageUrls && travel.imageUrls.length > 1 && (
                                   <div className="absolute bottom-6 left-6 z-20 glass px-4 py-2 rounded-full text-xs font-semibold text-slate-900 dark:text-white backdrop-blur-md bg-white/80 dark:bg-[#0a0a0a]/70 border border-slate-200 dark:border-white/10 shadow-lg flex items-center gap-2">
                                     <Images className="w-3.5 h-3.5" />
                                     查看图集 ({travel.imageUrls.length})
                                   </div>
                                 )}
                               </div>
                             </div>
                         </div>
                      </div>
                   )
                })}
             </div>
          )}

          {viewMode === 'matrix' && (
            <ConstellationMatrixView footprintNodes={footprintNodes} openLightbox={openLightbox} />
          )}

          {viewMode !== 'matrix' && totalPages > 1 && (
            <div className={cn("flex flex-col sm:flex-row justify-center items-center gap-4", viewMode === 'gallery' ? "mt-2 md:mt-4" : "mt-8")}>
              <div className="flex justify-center items-center gap-2">
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

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5">
                <span>每页显示</span>
                <input
                  type="text"
                  value={inputItemsPerPage}
                  onChange={handleItemsPerPageChange}
                  onBlur={handleItemsPerPageBlur}
                  onKeyDown={handleItemsPerPageKeyDown}
                  className="bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-text font-medium w-[4ch] text-center p-0 border-b border-transparent focus:border-indigo-500 transition-colors"
                />
                <span>条</span>
              </div>
            </div>
          )}
          
          {viewMode !== 'matrix' && totalPages <= 1 && filteredTravels.length > 0 && (
            <div className={cn("flex justify-center items-center", viewMode === 'gallery' ? "mt-2 md:mt-4" : "mt-8")}>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5">
                <span>每页显示</span>
                <input
                  type="text"
                  value={inputItemsPerPage}
                  onChange={handleItemsPerPageChange}
                  onBlur={handleItemsPerPageBlur}
                  onKeyDown={handleItemsPerPageKeyDown}
                  className="bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-0 cursor-text font-medium w-[4ch] text-center p-0 border-b border-transparent focus:border-indigo-500 transition-colors"
                />
                <span>条</span>
              </div>
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

      {/* Description Modal using Portal */}
      {createPortal(
        <AnimatePresence>
          {selectedDescription && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ perspective: '1000px' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDescription(null)}
                className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10, rotateX: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-2xl bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-200/50 dark:border-white/5">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedDescription.title || selectedDescription.location}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-indigo-500 dark:text-indigo-400 mt-1">
                      <span>{selectedDescription.date}</span>
                      <span className="w-1 h-1 rounded-full bg-indigo-500/50"></span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedDescription.location}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDescription(null)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 sm:p-8 overflow-y-auto overscroll-contain custom-scrollbar">
                  <p className="text-slate-700 dark:text-slate-300 leading-[1.8] text-base whitespace-pre-wrap">
                    {selectedDescription.description}
                  </p>
                </div>
                <div className="p-4 sm:p-6 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap items-center justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  <button
                    onClick={() => setSelectedDescription(null)}
                    className="px-6 py-2.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm border border-slate-200 dark:border-white/10 shadow-sm"
                  >
                    确定
                  </button>
                  {selectedDescription.externalLink && (
                    <a 
                      href={selectedDescription.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 shadow-sm shadow-indigo-500/20 border border-indigo-500/50 text-white font-medium rounded-xl transition-all text-sm flex items-center gap-2"
                    >
                      <span>{selectedDescription.externalLinkText || '查看完整来源'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function ConstellationMatrixView({ footprintNodes, openLightbox }: { footprintNodes: any[], openLightbox: (travel: any) => void }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeNodeName, setActiveNodeName] = useState<string | null>(null);
  const [focusLocation, setFocusLocation] = useState<string | null>(null);
  
  const isDragging = React.useRef(false);
  const lastMousePos = React.useRef({ x: 0, y: 0 });
  const lastTouchDist = React.useRef<number | null>(null);

  const scaleRef = React.useRef(scale);
  React.useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const mappedNodes = useMemo(() => {
    return footprintNodes.map((node, index) => {
      const angle = index * 2.39996; // 黄金角度
      const radius = 25 + Math.sqrt(index) * 60; 
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { ...node, x, y, index };
    });
  }, [footprintNodes]);

  const focusedNode = useMemo(() => {
    return mappedNodes.find(n => n.name === focusLocation);
  }, [mappedNodes, focusLocation]);

  React.useEffect(() => {
    if (mappedNodes.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      mappedNodes.forEach(n => {
        minX = Math.min(minX, n.x - 50);
        maxX = Math.max(maxX, n.x + 50);
        minY = Math.min(minY, n.y - 50);
        maxY = Math.max(maxY, n.y + 50);
      });

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const boxWidth = Math.max(maxX - minX, 100);
        const boxHeight = Math.max(maxY - minY, 100);
        
        const scaleX = (rect.width * 0.85) / boxWidth;
        const scaleY = (rect.height * 0.85) / boxHeight;
        
        const initialScale = Math.min(Math.max(0.2, Math.min(scaleX, scaleY)), 3);
        
        setScale(initialScale);
      } else {
        setScale(1);
      }
      
      setPan({ x: -cx, y: -cy });
    }
  }, [mappedNodes]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (focusLocation) return;
      e.preventDefault();
      
      const zoomFactor = 0.002;
      const deltaScale = -e.deltaY * zoomFactor;
      
      setScale(oldScale => {
        const newScale = Math.min(Math.max(0.2, oldScale + deltaScale * oldScale), 3);
        if (newScale === oldScale) return oldScale;

        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const dx = cx - rect.width / 2;
        const dy = cy - rect.height / 2;

        setPan(oldPan => ({
          x: oldPan.x + dx / newScale - dx / oldScale,
          y: oldPan.y + dy / newScale - dy / oldScale
        }));

        return newScale;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [focusLocation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (focusLocation) return;
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (focusLocation || !isDragging.current) return;
    setActiveNodeName(null);
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    setPan(prev => ({
      x: prev.x + dx / scaleRef.current,
      y: prev.y + dy / scaleRef.current
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (focusLocation) return;
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (focusLocation) return;
    setActiveNodeName(null);
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      setPan(prev => ({
        x: prev.x + dx / scaleRef.current,
        y: prev.y + dy / scaleRef.current
      }));
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      
      const ratio = dist / lastTouchDist.current;
      lastTouchDist.current = dist;
      
      const touchCx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const touchCy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      setScale(oldScale => {
        const newScale = Math.min(Math.max(0.2, oldScale * ratio), 3);
        if (newScale === oldScale) return oldScale;
        
        const el = containerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const screenDx = touchCx - rect.left - rect.width / 2;
          const screenDy = touchCy - rect.top - rect.height / 2;
          
          setPan(oldPan => ({
            x: oldPan.x + screenDx / newScale - screenDx / oldScale,
            y: oldPan.y + screenDy / newScale - screenDy / oldScale
          }));
        }
        
        return newScale;
      });
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastTouchDist.current = null;
  };

  const stars = useMemo(() => Array.from({length: 150}).map(() => ({
    x: Math.random() * 100, y: Math.random() * 100, r: Math.random() * 1.5, o: Math.random() * 0.5 + 0.1
  })), []);
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-[calc(100vh-140px)] min-h-[600px] bg-[#030305] rounded-3xl overflow-hidden border border-white/5 my-0",
        !focusLocation ? "cursor-grab active:cursor-grabbing touch-none" : ""
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => !focusLocation && setActiveNodeName(null)}
    >
      {/* Starfield background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0">
        {stars.map((s,i) => <circle key={`star-${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#e2e8f0" opacity={s.o} />)}
      </svg>

      {/* Macro Universe */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-1000 origin-center z-10",
          focusLocation ? "scale-[3] opacity-0 blur-3xl pointer-events-none" : "scale-100 opacity-100 pointer-events-auto"
        )}
      >
        <div 
          style={{ 
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`, 
            transformOrigin: 'center' 
          }} 
          className="absolute top-1/2 left-1/2 w-0 h-0 transition-transform duration-75 ease-out"
        >
          {/* Galaxy SVG Connection Lines */}
          <svg className="absolute overflow-visible pointer-events-none opacity-50">
            <polyline
              points={mappedNodes.map(n => `${n.x},${n.y}`).join(' ')}
              fill="none"
              stroke="url(#galaxy-gradient)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <defs>
              <linearGradient id="galaxy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                 <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Nodes Plotting */}
          {mappedNodes.map((node) => {
            const isBookmarked = node.bookmarked;
            const size = 12 + Math.min(node.count * 2, 20);

            return (
              <div 
                key={node.name}
                className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group z-10 hover:z-50"
                style={{ left: node.x, top: node.y }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusLocation(node.name);
                  setActiveNodeName(null);
                }}
                onMouseEnter={() => {
                  if (!focusLocation) setActiveNodeName(node.name);
                }}
                onMouseLeave={() => {
                  if (!focusLocation) setActiveNodeName(null);
                }}
              >
                 {/* The Planet */}
                 <div className={cn(
                    "rounded-full flex items-center justify-center transition-[transform,box-shadow] duration-300 hover:scale-[1.3] cursor-pointer shadow-lg",
                    isBookmarked ? "bg-amber-400" : "bg-indigo-400"
                 )}
                 style={{ 
                    width: size, 
                    height: size,
                    boxShadow: isBookmarked ? '0 0 16px rgba(251, 191, 36, 0.6)' : '0 0 12px rgba(129, 140, 248, 0.4)'
                 }}>
                    {isBookmarked && <Crown className="w-3 h-3 text-amber-900 absolute opacity-80" />}
                 </div>

                 {/* Constant minimalist text */}
                 <div className={cn(
                    "absolute top-full mt-1.5 text-[10px] whitespace-nowrap pointer-events-none transition-opacity",
                    isBookmarked ? "text-amber-200/90 font-medium" : "text-slate-300/80",
                    activeNodeName === node.name && "opacity-100 !text-white"
                 )}>
                    {node.name}
                    {node.count > 1 && <span className="ml-1 opacity-70">x{node.count}</span>}
                 </div>

                 {/* Hover Details Card (Glassmorphism) */}
                 <div className={cn(
                    "absolute bottom-full mb-3 transition-opacity duration-300 pointer-events-none z-20 w-max shadow-2xl",
                    activeNodeName === node.name ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100"
                 )}>
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs flex flex-col gap-1.5 min-w-[120px]">
                       <div className="text-white font-bold text-sm tracking-wide">{node.name}</div>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                          <span className="text-slate-300">打卡 <span className="text-white font-mono font-medium">{node.count}</span> 次</span>
                       </div>
                       <div className="text-slate-400 text-[10px] mt-1 pt-1.5 border-t border-white/5">
                          最近: {node.lastDate}
                       </div>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Micro Universe */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-1000 flex items-center justify-center z-20",
          focusLocation ? "scale-100 opacity-100 pointer-events-auto delay-150" : "scale-50 opacity-0 pointer-events-none"
        )}
      >
        {focusLocation && focusedNode && (
          <>
            <button 
              onClick={() => {
                setFocusLocation(null);
                setActiveNodeName(null);
              }}
              className="absolute top-6 left-6 pl-2 pr-4 pl pr py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 flex items-center gap-1 shadow-xl border border-white/10 backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">返回全景</span>
            </button>
            
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Central Star */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(129,140,248,0.6)] pointer-events-auto",
                  focusedNode.bookmarked ? "bg-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.6)]" : "bg-indigo-500"
                )}>
                  <MapPin className="w-8 h-8 text-white opacity-80" />
                </div>
              </div>
              
              {/* Central Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 sm:mt-14 z-10 flex flex-col items-center pointer-events-none">
                <div className="text-lg font-bold text-white tracking-widest bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10 whitespace-nowrap">{focusedNode.name}</div>
                <div className="text-xs text-indigo-200 mt-1.5 tracking-wider bg-black/40 px-3 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">{focusedNode.count} 次打卡</div>
              </div>

              {/* Orbiting Satellites */}
              <div 
                className="absolute top-1/2 left-1/2 w-0 h-0"
                style={{ animation: 'spin 120s linear infinite' }}
              >
                {focusedNode.records.map((record: any, index: number) => {
                  const angle = index * 2.39996;
                  const radius = 120 + Math.pow(index, 0.6) * 25;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const imgUrl = (record.imageUrls && record.imageUrls[0]) || record.imageUrl;
                  
                  return (
                    <div 
                      key={record.id || index}
                      className="absolute group cursor-pointer"
                      style={{ 
                        left: x, 
                        top: y,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Counter-rotation to keep images/cards upright */}
                      <div 
                        style={{ animation: 'spin 120s linear infinite reverse' }}
                        className="relative"
                      >
                         {/* Satellite Body */}
                         <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-indigo-400/50 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:border-indigo-300 group-hover:scale-[1.15] group-hover:shadow-[0_0_20px_rgba(129,140,248,0.6)] transition-all bg-slate-800 z-30 relative">
                           {imgUrl ? (
                             <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-indigo-900/50">
                               <MapPin className="w-5 h-5 text-indigo-300" />
                             </div>
                           )}
                         </div>

                         {/* Physical bridge and hover card */}
                         <div className="absolute top-1/2 left-full -translate-y-1/2 pl-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-[100] transition-all duration-300">
                           <div 
                             className="bg-black/80 backdrop-blur-xl rounded-xl p-4 w-56 border border-white/10 shadow-2xl hover:bg-black/90 transition-colors"
                             onClick={(e) => { e.stopPropagation(); openLightbox(record); }}
                           >
                             <div className="text-base font-bold text-white mb-1 line-clamp-2 leading-tight">{record.title || record.location}</div>
                             <div className="flex items-center gap-2 mb-2">
                               <div className="font-mono text-xs text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-500/30">{record.date}</div>
                             </div>
                             {imgUrl && (
                               <div className="text-xs text-indigo-400 flex items-center gap-1.5 pt-2 border-t border-white/10 mt-1">
                                 <Images className="w-3.5 h-3.5" /> 点击回溯记忆
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

