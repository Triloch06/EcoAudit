"use client";

import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="py-8 max-w-3xl mx-auto flex justify-center">
        <div className="animate-pulse bg-slate-200 h-64 w-full rounded-xl"></div>
      </div>
    );
  }

  // user.user_metadata might contain role
  const role = user.user_metadata?.role === 'admin' ? 'Admin' : 'Standard User';

  return (
    <div className="py-2 space-y-8 max-w-[1000px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Account Settings
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
          Manage your account preferences and view your profile information.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Profile Information</CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-full border border-emerald-200 dark:border-emerald-800/50">
              <User className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-4 flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    {user.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</label>
                  <div className="font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {role === 'Admin' ? <Shield className="h-4 w-4 text-rose-500" /> : <User className="h-4 w-4 text-emerald-500" />}
                    {role}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button 
              variant="destructive" 
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
