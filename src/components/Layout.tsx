import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Compass, Book, User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useSettings } from '../lib/SettingsContext';
import { useData } from '../lib/DataContext';

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useSettings();
  const { refresh } = useData();
  const location = useLocation();

  useEffect(() => {
    refresh();
  }, [location.pathname]); // Auto-refresh data on page switch

  const NAV_ITEMS = [
    { path: '/', label: t('nav.home'), icon: User },
    { path: '/travels', label: t('nav.travels'), icon: Compass },
    { path: '/bookmarks', label: t('nav.bookmarks'), icon: Book },
  ];

  return (
    <div className="relative h-screen w-full flex overflow-hidden flex-col md:flex-row">
      <div className="fixed -top-40 -right-40 w-96 h-96 glow-purple z-0 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] glow-indigo z-0 pointer-events-none" />

      {/* PC/Tablet Sidebar Navigation */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-full fixed left-0 top-0 border-r border-slate-200 dark:border-white/10 glass z-50 py-6 transition-all duration-300",
          isCollapsed ? "w-20 px-0" : "w-64 px-4"
        )}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-full p-1 text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-black z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn("flex items-center mb-10 transition-all", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="font-bold text-white text-xs">萌</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-slate-900 dark:text-white tracking-tight break-keep">萌芽</span>}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(isActive ? "sidebar-item-active" : "sidebar-item", isCollapsed ? "justify-center px-0 mx-4" : "")}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="break-keep">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-1 overflow-x-hidden">
          {!isCollapsed && <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold px-4 mb-2">{t('nav.system')}</div>}
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(isActive ? "sidebar-item-active" : "sidebar-item", isCollapsed ? "justify-center px-0 mx-4" : "")}
            title={isCollapsed ? t('nav.settings') : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="break-keep">{t('nav.settings')}</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 relative z-10 w-full mb-20 md:mb-0 h-full flex flex-col pt-[max(env(safe-area-inset-top),_0px)] transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-12 pt-8">
          <div className={cn("mx-auto w-full transition-all duration-300", location.pathname === '/travels' ? "max-w-full 2xl:max-w-screen-3xl" : "max-w-5xl")}>
            <OutAnimatedWrapper />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-panel rounded-2xl flex justify-around items-center p-2 border">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300',
                isActive ? 'text-slate-900 bg-slate-900/5 dark:text-white dark:bg-white/10' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white/80'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
         <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300',
                isActive ? 'text-slate-900 bg-slate-900/5 dark:text-white dark:bg-white/10' : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white/80'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('nav.settings')}</span>
          </NavLink>
      </nav>
    </div>
  );
}

// Animate route transitions
function OutAnimatedWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      key={window.location.pathname}
    >
      <Outlet />
    </motion.div>
  );
}
