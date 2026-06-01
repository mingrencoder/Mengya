import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'en';
type Theme = 'dark' | 'light';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  animations: boolean;
  setAnimations: (anim: boolean) => void;
  notifications: boolean;
  setNotifications: (notif: boolean) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    'nav.home': '主页概览',
    'nav.travels': '时光旅行',
    'nav.bookmarks': '阅读书签',
    'nav.settings': '系统设置',
    'nav.system': '系统',
    'settings.title': '系统设置',
    'settings.desc': '访客偏好设置，部分设置仅在当前浏览器生效。',
    'settings.lang.title': '语言与地区',
    'settings.lang.label': '显示语言',
    'settings.lang.desc': '选择系统使用的默认语言',
    'settings.theme.title': '外观与显示',
    'settings.theme.label': '主题模式',
    'settings.theme.desc': '选择适合您的界面主题风格',
    'settings.theme.dark': '深色模式',
    'settings.theme.light': '浅色模式',
    'settings.anim.label': '动画效果',
    'settings.anim.desc': '启用页面切换和交互的过渡动画',
    'settings.notif.title': '通知选项',
    'settings.notif.label': '系统通知',
    'settings.notif.desc': '接收关于网站更新和动态的通知'
  },
  en: {
    'nav.home': 'Overview',
    'nav.travels': 'Travels',
    'nav.bookmarks': 'Bookmarks',
    'nav.settings': 'Settings',
    'nav.system': 'SYSTEM',
    'settings.title': 'System Settings',
    'settings.desc': 'Visitor preferences. Some settings only apply to current browser.',
    'settings.lang.title': 'Language & Region',
    'settings.lang.label': 'Display Language',
    'settings.lang.desc': 'Select the default system language',
    'settings.theme.title': 'Appearance',
    'settings.theme.label': 'Theme Mode',
    'settings.theme.desc': 'Choose your preferred interface theme',
    'settings.theme.dark': 'Dark Mode',
    'settings.theme.light': 'Light Mode',
    'settings.anim.label': 'Animations',
    'settings.anim.desc': 'Enable transition animations for pages and interactions',
    'settings.notif.title': 'Notifications',
    'settings.notif.label': 'System Notifications',
    'settings.notif.desc': 'Receive notifications about website updates'
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('app_lang') as Language || 'zh');
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('app_theme') as Theme || 'dark');
  const [animations, setAnimations] = useState<boolean>(() => localStorage.getItem('app_anim') !== 'false');
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem('app_notif') !== 'false');

  useEffect(() => {
    localStorage.setItem('app_lang', language);
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('app_anim', animations ? 'true' : 'false');
    localStorage.setItem('app_notif', notifications ? 'true' : 'false');
    
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    }

    if (!animations) {
      document.documentElement.classList.add('disable-animations');
    } else {
      document.documentElement.classList.remove('disable-animations');
    }
  }, [language, theme, animations, notifications]);

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, animations, setAnimations, notifications, setNotifications, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
