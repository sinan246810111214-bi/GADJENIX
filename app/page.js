'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { 
  Zap, 
  Cpu, 
  ChevronRight, 
  Star, 
  ShoppingCart, 
  ArrowRight,
  Shield,
  Truck,
  RotateCcw,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Site Settings for branding
        const settingsSnap = await getDoc(doc(db, 'settings', 'site_config'));
        const settings = settingsSnap.exists() ? settingsSnap.data() : {};
        
        // Use banners from settings if available, otherwise fetch from collection
        if (settings.banners && settings.banners.length > 0) {
          setBanners(settings.banners);
        } else {
          const bannersSnap = await getDocs(collection(db, 'banners'));
          setBanners(bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch Featured Products
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(8)));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const defaultBanner = {
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1500&auto=format&fit=crop",
    title: "EVOLVE YOUR AUDIO MATRIX",
    tagline: "Next-Gen Interface Enabled",
    description: "Experience the future of personal acoustics. Precision hardware meets algorithmic sound design."
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-primary/20">
      {/* HERO SYSTEM */}
      <section className="relative h-[90vh] overflow-hidden bg-slate-900 px-8 py-10">
         <div className="absolute inset-0 z-0">
            <img 
              src={banners[0]?.imageUrl || banners[0]?.url || defaultBanner.imageUrl} 
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
              alt="Hero Banner"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
         </div>

         <div className="relative z-10 max-w-[1500px] mx-auto h-full flex flex-col justify-center gap-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8 max-w-4xl"
            >
               <Badge className="bg-primary/20 text-primary border-primary/30 px-6 py-2 rounded-full font-black uppercase tracking-[0.4em] text-[10px] backdrop-blur-xl">
                  {banners[0]?.tagline || defaultBanner.tagline}
               </Badge>
               <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter">
                  {banners[0]?.title || defaultBanner.title}
               </h1>
               <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl leading-relaxed">
                  {banners[0]?.description || defaultBanner.description}
               </p>
               <div className="flex flex-wrap gap-6 pt-6">
                  <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">
                      EXPLORE CATALOG
                      <ArrowRight className="ml-4 w-6 h-6" />
                  </Button>
                  <Button variant="outline" size="lg" className="h-20 px-12 rounded-[2rem] border-white/20 text-white font-black text-xl backdrop-blur-xl hover:bg-white hover:text-slate-900 transition-all">
                      CORE TECHNOLOGY
                  </Button>
               </div>
            </motion.div>
         </div>
      </section>

      {/* TECH GRID (FEATURED PRODUCTS) */}
      <section className="max-w-[1500px] mx-auto px-8 py-32 space-y-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-l-8 border-primary pl-10">
            <div className="space-y-4">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase leading-[0.9]">
                  Featured Hardware
               </h2>
               <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[11px]">Deploying latest audio infrastructure</p>
            </div>
            <Link href="/products">
               <Button variant="ghost" className="h-14 font-black text-xs tracking-widest uppercase hover:bg-slate-100 px-8 rounded-2xl">
                  View All Tech Nodes
                  <ChevronRight className="ml-3 w-4 h-4" />
               </Button>
            </Link>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-100 rounded-[3rem] animate-pulse" />
              ))
            ) : (
              products.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group">
                  <div className="bg-white rounded-[3.5rem] p-8 border border-slate-100 hover:border-primary transition-all duration-500 shadow-xl shadow-slate-900/5 hover:shadow-primary/10 relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-8 right-8 z-10">
                       <Badge className="bg-slate-900 text-white border-none rounded-xl px-4 py-2 font-black text-[9px] uppercase tracking-widest">
                          {product.category}
                       </Badge>
                    </div>
                    
                    <div className="aspect-square relative flex items-center justify-center p-6 group-hover:scale-110 transition-transform duration-700">
                       <img 
                          src={product.thumbnail || product.image} 
                          alt={product.name} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                       />
                    </div>

                    <div className="mt-10 space-y-4">
                       <div className="flex items-center gap-2 text-primary">
                          <Star className="w-3.5 h-3.5 fill-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{product.rating || '4.9'}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">
                          {product.name}
                       </h3>
                       <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{product.tag || 'Audio Precision'}</p>
                    </div>

                    <div className="mt-auto pt-10 flex items-center justify-between">
                       <span className="text-3xl font-black font-mono text-slate-900">${product.price}</span>
                       <Button size="icon" className="w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 group-hover:bg-primary transition-colors hover:scale-110 active:scale-95">
                          <ShoppingCart className="w-5 h-5" />
                       </Button>
                    </div>
                  </div>
                </Link>
              ))
            )}
         </div>
      </section>

      {/* SYSTEM GUARANTEES */}
      <section className="bg-slate-900 py-32 px-8 overflow-hidden relative">
         <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[200px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none" />
         
         <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
            {[
              { icon: Shield, title: 'Identity Protection', desc: 'Secure encryption nodes for every transaction.' },
              { icon: Truck, title: 'Logistics Matrix', title: 'Global distribution network for rapid deployment.', desc: 'Rapid logistics system.' },
              { icon: RotateCcw, title: 'Logic Reset', desc: '30-day return cycle for optimized decision making.' }
            ].map((item, i) => (
              <div key={i} className="p-12 bg-white/5 border border-white/10 rounded-[3.5rem] backdrop-blur-xl group hover:bg-white/10 transition-all">
                 <item.icon className="w-12 h-12 text-primary mb-10 group-hover:scale-110 transition-transform" />
                 <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{item.title}</h4>
                 <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* FOOTER TERMINAL */}
      <footer className="bg-slate-50 py-20 px-8 border-t border-slate-100">
         <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2 space-y-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                     <Zap className="w-6 h-6 text-white fill-primary" />
                  </div>
                  <span className="text-3xl font-black tracking-tighter uppercase underline decoration-primary decoration-4 underline-offset-4">GADGENIX</span>
               </div>
               <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
                  Superior audio engineering for the digital generation. Experience hardware that transcends the standard.
               </p>
            </div>
            
            <div className="space-y-8">
               <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Protocols</h5>
               <ul className="space-y-4 text-sm font-black text-slate-400 uppercase tracking-widest">
                  <li className="hover:text-primary transition-colors cursor-pointer">Shipping Matrix</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Returns Logic</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Security Core</li>
               </ul>
            </div>

            <div className="space-y-8">
               <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Terminal</h5>
               <ul className="space-y-4 text-sm font-black text-slate-400 uppercase tracking-widest">
                  <li className="hover:text-primary transition-colors cursor-pointer">Admin Access</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Support Relay</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">API Status</li>
               </ul>
            </div>
         </div>
         
         <div className="max-w-[1500px] mx-auto mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© 2026 GADGENIX CORE INTERFACE. ALL LOGIC RESERVED.</p>
            <div className="flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <span className="hover:text-slate-900 cursor-pointer">Privacy Matrix</span>
               <span className="hover:text-slate-900 cursor-pointer">Legal Frames</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
