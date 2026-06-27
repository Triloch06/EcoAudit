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
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">EcoAudit</span>
      </div>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <a href="/" className="text-slate-600 dark:text-[#CBD5E1] hover:text-emerald-600 dark:hover:text-[#34D399] font-medium transition-colors">Log Waste</a>
            <a href="/dashboard" className="text-slate-600 dark:text-[#10B981] hover:text-emerald-600 dark:hover:text-[#34D399] font-medium transition-colors">Dashboard</a>
            <ThemeToggle />
            <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <User size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{user.email}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <ThemeToggle />
            <a href="/login" className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium ml-2 transition-colors">Login</a>
          </>
        )}
      </div>
    </nav>
  );
}
