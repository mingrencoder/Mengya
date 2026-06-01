import React from 'react';
import { Globe, Monitor, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../lib/SettingsContext';

export function SettingsPage() {
  const { language, setLanguage, theme, setTheme, animations, setAnimations, notifications, setNotifications, t } = useSettings();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-slate-500 dark:text-white/50">{t('settings.desc')}</p>
      </div>

      <div className="grid gap-6">
        {/* Language & Region */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-white">{t('settings.lang.title')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-slate-900 dark:text-white font-medium">{t('settings.lang.label')}</div>
                <div className="text-sm text-slate-500 dark:text-white/50">{t('settings.lang.desc')}</div>
              </div>
              <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setLanguage('zh')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm transition-all",
                    language === 'zh' ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
                  )}
                >
                  简体中文
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm transition-all",
                    language === 'en' ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
                  )}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Monitor className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-white">{t('settings.theme.title')}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-slate-900 dark:text-white font-medium">{t('settings.theme.label')}</div>
                <div className="text-sm text-slate-500 dark:text-white/50">{t('settings.theme.desc')}</div>
              </div>
              <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm transition-all",
                    theme === 'light' ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
                  )}
                >
                  {t('settings.theme.light')}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm transition-all",
                    theme === 'dark' ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
                  )}
                >
                  {t('settings.theme.dark')}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-slate-900 dark:text-white font-medium">{t('settings.anim.label')}</div>
                <div className="text-sm text-slate-500 dark:text-white/50">{t('settings.anim.desc')}</div>
              </div>
              <button 
                onClick={() => setAnimations(!animations)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  animations ? "bg-indigo-500" : "bg-slate-300 dark:bg-white/20"
                )}
              >
                <span 
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    animations ? "translate-x-6" : "translate-x-1"
                  )} 
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-white">{t('settings.notif.title')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-slate-900 dark:text-white font-medium">{t('settings.notif.label')}</div>
                <div className="text-sm text-slate-500 dark:text-white/50">{t('settings.notif.desc')}</div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  notifications ? "bg-indigo-500" : "bg-slate-300 dark:bg-white/20"
                )}
              >
                <span 
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    notifications ? "translate-x-6" : "translate-x-1"
                  )} 
                />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
