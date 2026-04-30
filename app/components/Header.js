'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  Zap, 
  Cpu, 
  Watch, 
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const pathname = usePathname();

  // Don't show header on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for site config changes
    const unsub = onSnapshot(doc(db, 'settings', 'site_config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsub();
    };
  }, []);

  const navItems = [
    { label: 'Products', path: '/products', icon: Cpu },
    { label: 'Comparison', path: '/compare', icon: Watch },
    { label: 'Support', path: '/support', icon: ExternalLink },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-500",
      isScrolled ? "py-3 bg-white/70 backdrop-blur-2xl border-b border-slate-100 shadow-xl shadow-slate-900/5 px-4" : "py-8 bg-transparent px-8"
    )}>
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-10">
        <Link href="/" className="flex items-center gap-4 shrink-0 group">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:scale-110 transition-all duration-500 overflow-hidden p-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <Zap className="w-7 h-7 text-white fill-primary animate-pulse" />
            )}
          </div>
          <div className="flex flex-col">
             <span className="text-2xl font-black tracking-tighter uppercase leading-none">
               {settings?.siteTitle || 'GADGENIX'}
             </span>
             <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase opacity-60">Premium Matrix</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-12 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
           {navItems.map((item) => (
             <Link 
               key={item.label} 
               href={item.path} 
               className={cn(
                 "hover:text-slate-900 transition-colors relative group py-2",
                 pathname === item.path && "text-slate-900"
               )}
             >
               {item.label}
               <span className={cn(
                 "absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all duration-300 origin-left scale-x-0 group-hover:scale-x-100",
                 pathname === item.path && "scale-x-100"
               )} />
             </Link>
           ))}
        </nav>

        {/* Global Action Terminal */}
        <div className="flex items-center gap-4">
           {/* Search Icon (Desktop) */}
           <Button variant="ghost" size="icon" className="hidden md:flex rounded-2xl w-12 h-12 hover:bg-slate-100 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
           </Button>

           {/* Cart Node */}
           <Button size="lg" className="h-14 rounded-[1.4rem] px-8 bg-slate-900 shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-black text-[12px] uppercase tracking-widest hidden sm:inline-block">Registry</span>
              <div className="w-6 h-6 bg-primary text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg">0</div>
           </Button>

           {/* Mobile Trigger */}
           <Button 
             variant="outline" 
             size="icon" 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="lg:hidden w-14 h-14 rounded-2xl border-slate-200"
           >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </Button>
        </div>
      </div>

      {/* Mobile Interaction Layer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl px-6 py-10 lg:hidden"
          >
            <div className="grid gap-6">
               {navItems.map((item) => (
                 <Link 
                   key={item.label} 
                   href={item.path} 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] group"
                 >
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <item.icon className="w-5 h-5 text-primary" />
                       </div>
                       <span className="font-black uppercase tracking-tight text-lg">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-2 transition-transform" />
                 </Link>
               ))}
               <Link 
                 href="/admin/login" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="flex items-center gap-4 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl justify-center font-black uppercase text-xs tracking-[0.3em]"
               >
                  <User className="w-5 h-5 text-primary" />
                  Terminal Access (Admin)
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
