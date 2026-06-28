"use client";

import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mb-8 max-w-7xl mx-auto">
      <nav className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gradient">EcoAudit</span>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <a href="/" className="text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Log Waste</a>
              <a href="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Dashboard</a>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <ThemeToggle />
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                  <User size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{user.email}</span>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:rotate-12" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <a href="/login" className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-all shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40">Login</a>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
