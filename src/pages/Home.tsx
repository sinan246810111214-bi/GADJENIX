import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, getDocs, limit, query, getDoc, doc } from 'firebase/firestore';
import { ShoppingCart, Zap, Cpu, Headphones, Watch, ArrowRight, Star, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function Home() {
  const [banners, setBanners] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let settings: any = {};
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'site_config'));
          settings = settingsSnap.exists() ? settingsSnap.data() : {};
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'settings/site_config');
        }
        
        if (settings.banners && settings.banners.length > 0) {
          setBanners(settings.banners);
        } else {
          try {
            const bannersSnap = await getDocs(collection(db, 'banners'));
            setBanners(bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, 'banners');
          }
        }

        try {
          const productsSnap = await getDocs(query(collection(db, 'products'), limit(8)));
          setFeaturedProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'products');
        }
      } catch (err) {
        console.error('Home data major error:', err);
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
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] overflow-hidden bg-slate-900 rounded-[3rem] mt-4 mx-4 px-8 py-10">
         <div className="absolute inset-0 z-0">
            <img 
              src={banners[0]?.imageUrl || banners[0]?.url || defaultBanner.imageUrl} 
              className="w-full h-full object-cover opacity-50 mix-blend-overlay"
              alt="Hero"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
         </div>

         <div className="relative z-10 h-full flex flex-col justify-center max-w-4xl space-y-8">
            <Badge className="w-fit bg-primary/20 text-primary border-primary/30 px-6 py-2 rounded-full font-black uppercase tracking-[0.4em] text-[10px] backdrop-blur-xl">
               {banners[0]?.tagline || defaultBanner.tagline}
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter">
               {banners[0]?.title || defaultBanner.title}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
               {banners[0]?.description || defaultBanner.description}
            </p>
            <div className="flex gap-4">
               <Link to="/products">
                 <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/40 hover:scale-105 transition-all">
                    Shop Now <ArrowRight className="ml-2 w-5 h-5" />
                 </Button>
               </Link>
            </div>
         </div>
      </section>

      {/* Categories */}
      <section className="px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { name: "Audio System", icon: Headphones, color: "bg-blue-500", desc: "Studio-grade precision" },
           { name: "Wearable Tech", icon: Watch, color: "bg-purple-500", desc: "Biometric monitoring" },
           { name: "Core Units", icon: Cpu, color: "bg-green-500", desc: "High-performance modules" },
         ].map((cat, idx) => (
           <Card key={idx} className="p-8 group hover:border-primary/50 transition-all cursor-pointer rounded-[2rem] border-slate-200">
              <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform`}>
                 <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">{cat.name}</h3>
              <p className="text-slate-500 font-medium">{cat.desc}</p>
           </Card>
         ))}
      </section>

      {/* Featured Products */}
      <section className="px-8 space-y-10">
         <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black tracking-tight uppercase">Featured Modules</h2>
            <Link to="/products" className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all">
               View All Protocols <ArrowRight className="w-5 h-5" />
            </Link>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <div className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
                   <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl bg-slate-50">
                      {(product.imageUrl || product.image) ? (
                        <img 
                          src={product.imageUrl || product.image} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={product.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-12 h-12 text-slate-200" />
                        </div>
                      )}
                      {product.tag && (
                        <Badge className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border-none">
                           {product.tag}
                        </Badge>
                      )}
                   </div>
                   <div className="space-y-2 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                      <h3 className="text-xl font-bold line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-center gap-4 pt-2">
                         <span className="text-2xl font-black text-slate-900 font-mono">₹{product.price}</span>
                         {product.oldPrice && (
                           <span className="text-sm text-slate-400 line-through font-bold">₹{product.oldPrice}</span>
                         )}
                      </div>
                   </div>
                </div>
              </Link>
            ))}
         </div>
      </section>

      {/* Trust Markers */}
      <section className="bg-slate-900 py-24 mx-4 rounded-[3rem] px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
         <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-tight">Encrypted Security</h4>
            <p className="text-slate-400 font-medium">Military-grade protection for all transactions.</p>
         </div>
         <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-tight">Express Logistics</h4>
            <p className="text-slate-400 font-medium">Standard 24-hour dispatch on all global orders.</p>
         </div>
         <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <Star className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-tight">Verified Quality</h4>
            <p className="text-slate-400 font-medium">Every module undergoes 12-point hardware inspection.</p>
         </div>
      </section>
    </div>
  );
}

const Card = ({ children, className, ...props }: any) => (
  <div className={`bg-white rounded-3xl border border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);
