"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  PlusCircle, 
  Settings, 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Log Waste', href: '/', icon: PlusCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-[260px] shrink-0 h-screen relative overflow-hidden">
      {/* Full sidebar background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/sidebar-bg.png')" }}
      ></div>
      {/* Dark green overlay to darken and tint the image */}
      <div className="absolute inset-0 bg-[#162b1e]/60"></div>

      {/* Content on top */}
      <div className="relative z-10 flex flex-col h-full px-5 py-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10 mt-2">
          <img 
            src="/logo.png" 
            alt="EcoAudit Logo" 
            className="w-16 h-16 rounded-full object-cover shadow-md shrink-0" 
          />
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-white tracking-tight leading-tight">EcoAudit</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-[#3a5a3a]/70 text-white font-semibold border border-[#4a6a4a]/50 backdrop-blur-sm" 
                    : "text-[#c5d8b8] hover:bg-[#2a4a2a]/40 hover:text-white"
                )}
              >
                <link.icon className={cn(
                  "w-6 h-6 shrink-0", 
                  isActive ? "text-[#d4e8c4]" : "text-[#8faa80]"
                )} />
                <span className="text-[15px]">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
