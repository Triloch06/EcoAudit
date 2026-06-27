"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      const role = data.user?.user_metadata?.role || "user";
      
      if (activeTab === "admin" && role !== "admin") {
        toast.error("You do not have admin privileges.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Successfully logged in");
      router.push(activeTab === "admin" ? "/admin" : "/dashboard");
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          role: activeTab === "admin" ? "admin" : "user"
        }
      }
    });
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Sign up successful! You can now log in.");
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to EcoAudit</CardTitle>
          <CardDescription>Login or create an account to log waste</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'user' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('user')}
            >
              User Login
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Loading..." : "Login"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleSignUp} disabled={loading}>
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
