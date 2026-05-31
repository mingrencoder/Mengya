import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Compass, Book, User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { path: '/', label: '首页简介', icon: User },
  { path: '/travels', label: '旅行记录', icon: Compass },
  { path: '/bookmarks', label: '常用收藏', icon: Book },
];

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative h-screen w-full flex overflow-hidden flex-col lg:flex-row">
      <div className="fixed -top-40 -right-40 w-96 h-96 glow-purple z-0 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[500px] h-[500px] glow-indigo z-0 pointer-events-none" />

      {/* PC Sidebar Navigation */}
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden lg:flex flex-col h-full fixed left-0 top-0 border-r border-white/10 glass z-50 py-6 px-4 transition-all duration-300"
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-black/50 border border-white/10 rounded-full p-1 text-white/50 hover:text-white hover:bg-black z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn("flex items-center mb-10 transition-all", isCollapsed ? "justify-center px-0" : "gap-3 px-4")}>
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="font-bold text-white text-xs">萌</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-white tracking-tight break-keep">萌芽</span>}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-4 mb-2">概览</div>}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(isActive ? "sidebar-item-active" : "sidebar-item", isCollapsed ? "justify-center px-0" : "")}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="break-keep">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-1 overflow-x-hidden">
          {!isCollapsed && <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-4 mb-2">账户</div>}
          <NavLink
            to="/admin"
            className={({ isActive }) => cn(isActive ? "sidebar-item-active" : "sidebar-item", isCollapsed ? "justify-center px-0" : "")}
            title={isCollapsed ? "后台管理" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="break-keep">后台管理</span>}
          </NavLink>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
        animate={{ marginLeft: isCollapsed ? 80 : 256 }}
        className="flex-1 lg:ml-64 relative z-10 w-full mb-20 lg:mb-0 h-full flex flex-col pt-[max(env(safe-area-inset-top),_0px)] transition-all duration-300"
      >
        <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-24 md:pb-12 pt-8">
          <div className="max-w-5xl mx-auto w-full">
            <OutAnimatedWrapper />
          </div>
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-50 glass-panel rounded-2xl flex justify-around items-center p-2 border">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300',
                isActive ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/80'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
         <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300',
                isActive ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/80'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">后台管理</span>
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
