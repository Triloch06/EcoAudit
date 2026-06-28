"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';

export function Header() {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-end px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1 rounded-full">
                <User size={14} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                {user.email}
              </span>
              <ChevronDown size={14} className="text-slate-500 ml-1" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-all shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
