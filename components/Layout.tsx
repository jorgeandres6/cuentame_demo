
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, darkMode, toggleDarkMode }) => {
  const [ecuadorTime, setEcuadorTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setEcuadorTime(formatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    // Redireccionar a Biblioteca Virtual en SharePoint
    window.open('https://dinamicaweecuador-my.sharepoint.com/:f:/g/personal/jorge_dinamicaweecuador_onmicrosoft_com/IgCmAmwKKF2-Tb6Bdy4Z3pAmAbzxh5pi9me_LV97spvpalU?e=NM9zGD', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-indigo-800 dark:bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <span className="font-extrabold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight hidden xs:block">CUÉNTAME</span>
            </div>
            
            {/* Ecuador Clock - Now visible on all screens with responsive sizing */}
            <div className="flex flex-col border-l border-gray-300 dark:border-gray-600 pl-3 sm:pl-4 overflow-hidden">
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">Ecuador</span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 tabular-nums whitespace-nowrap">
                {ecuadorTime}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Biblioteca Virtual Global Button - Only shown if user is logged in */}
            {userRole && (
              <button 
                onClick={openLibrary}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 sm:px-3 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition border border-blue-200 dark:border-blue-800 group"
                title="Biblioteca Virtual"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span className="hidden sm:inline">Biblioteca Virtual</span>
              </button>
            )}

            {/* Dark Mode Switch */}
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-10 sm:h-7 sm:w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle Dark Mode</span>
              <span
                className={`${
                  darkMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-transform flex items-center justify-center`}
              >
                {darkMode ? (
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                ) : (
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                )}
              </span>
            </button>

            {userRole && (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-block text-[10px] text-white font-bold px-3 py-1 bg-gray-800 dark:bg-gray-600 rounded-full shadow-sm uppercase tracking-wider">
                  {userRole === UserRole.ADMIN || userRole === UserRole.STAFF ? 'Panel Institucional' : 'Espacio Seguro'}
                </span>
                <button 
                  onClick={onLogout}
                  className="text-[9px] sm:text-xs text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-bold border border-red-200 dark:border-red-800 px-2 sm:px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition uppercase whitespace-nowrap"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
