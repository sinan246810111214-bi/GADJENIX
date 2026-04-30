import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, OperationType, handleFirestoreError } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { ShoppingCart, Menu, Search, User, Zap, Cpu, Watch, Headphones, Globe } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Compare from './pages/Compare';
import ChatAssistant from './components/ChatAssistant';
import CartDrawer from './components/CartDrawer';
import { Toaster, toast } from 'sonner';

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSearchSuggestions, analyzeSearchIntent } from './services/geminiService';
import { useCart } from './lib/store';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const navigate = useNavigate();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { getTotalItems, setIsOpen: setDrawerOpen } = useCart();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site_config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/site_config');
    });
    return () => unsub();
  }, []);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Authentication Protocol Success");
    } catch (err) {
      toast.error("Auth Failure");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Disconnected");
    } catch (err) {
      toast.error("Logout Failure");
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsAnalyzing(true);
    setShowSuggestions(false);
    const intent = await analyzeSearchIntent(query);
    setIsAnalyzing(false);
    const params = new URLSearchParams();
    if (intent.category) params.set('category', intent.category);
    params.set('q', intent.correctedQuery || query);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className={cn(
      "sticky top-0 z-[100] w-full transition-all duration-300",
      isScrolled ? "py-2 bg-white/80 backdrop-blur-xl border-b border-border shadow-sm" : "py-6 bg-transparent"
    )}>
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform overflow-hidden p-1">
            {(settings?.logoUrl && settings.logoUrl !== "") ? (
              <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <Zap className="w-6 h-6 text-white fill-current" />
            )}
          </div>
          <span className="text-2xl font-bold font-heading tracking-tight hidden sm:block uppercase">
            {settings?.siteTitle || 'GADGENIX'}
          </span>
        </Link>

        {/* Search Bar - Modern & Integrated */}
        <div className="flex-1 max-w-2xl relative hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search for gadgets, brands, or categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="w-full h-12 pl-12 pr-12 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-sm font-medium"
            />
            {isAnalyzing && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                ref={suggestionsRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 bg-white mt-2 rounded-2xl shadow-2xl border border-border overflow-hidden z-[60] p-2"
              >
                {suggestions.map((s, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setSearchQuery(s);
                      handleSearch(s);
                    }}
                    className="px-4 py-3 hover:bg-muted rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium transition-colors"
                  >
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                       <Search className="w-3.3 h-3.3 text-gray-400" />
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
                <div className="bg-primary/5 px-4 py-2 mt-2 rounded-xl text-[10px] text-primary uppercase tracking-widest font-bold text-center">
                  Smart AI Search Active
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <nav className="hidden lg:flex items-center gap-8 mr-4 text-sm font-semibold text-muted-foreground">
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            <Link to="/compare" className="hover:text-primary transition-colors">Compare</Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" onClick={handleLogout} className="hidden md:flex gap-2 rounded-2xl bg-muted/50 font-bold px-4">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-5 h-5 rounded-full" alt={user.displayName || 'User'} />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-[10px] uppercase truncate max-w-[80px]">{user.displayName}</span>
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleGoogleLogin} className="hidden md:flex gap-2 rounded-2xl bg-muted/50 font-bold px-4">
                <User className="w-4 h-4" />
                <span className="text-[10px] uppercase">Login</span>
              </Button>
            )}
            <button 
              onClick={() => setDrawerOpen(true)}
              className="relative p-3 bg-muted/50 hover:bg-muted rounded-2xl transition-colors group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {getTotalItems()}
                </span>
              )}
            </button>

            <Sheet>
               <SheetTrigger
                 render={
                   <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl bg-muted/50">
                      <Menu className="w-5 h-5" />
                   </Button>
                 }
               />
               <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-[2rem] border-none shadow-2xl">
                  <div className="mt-12 space-y-8">
                     <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Main Menu</p>
                        <div className="grid gap-2">
                           {[
                             { label: 'Home', path: '/', icon: Zap },
                             { label: 'Products', path: '/products', icon: Cpu },
                             { label: 'Comparison', path: '/compare', icon: Watch },
                           ].map((item) => (
                             <Link 
                               key={item.label}
                               to={item.path} 
                               className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted transition-colors font-bold text-lg"
                             >
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                                   <item.icon className="w-5 h-5" />
                                </div>
                                {item.label}
                             </Link>
                           ))}
                        </div>
                     </div>
                  </div>
               </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="w-full bg-secondary text-white pt-24 pb-12 rounded-t-[3rem]">
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
      <div className="md:col-span-4 space-y-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">GADGENIX</span>
        </Link>
        <p className="text-gray-400 max-w-sm leading-relaxed">
          Premium tech marketplace delivering the world's most advanced gadgets to your doorstep. Experience excellence in every click.
        </p>
        <div className="flex gap-4">
           {['fb', 'tw', 'ig', 'yt'].map(s => (
             <div key={s} className="w-10 h-10 bg-white/5 rounded-xl hover:bg-primary transition-colors cursor-pointer flex items-center justify-center font-bold uppercase text-[10px]">{s}</div>
           ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Shop</h4>
        <ul className="space-y-3 text-sm text-gray-400">
          <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
          <li><Link to="/products?category=Audio" className="hover:text-white transition-colors">Audio Gear</Link></li>
          <li><Link to="/products?category=Wearables" className="hover:text-white transition-colors">Smart Watches</Link></li>
          <li><Link to="/products?category=Accessories" className="hover:text-white transition-colors">Accessories</Link></li>
        </ul>
      </div>

      <div className="md:col-span-2">
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Support</h4>
        <ul className="space-y-3 text-sm text-gray-400">
          <li><Link to="/" className="hover:text-white transition-colors">Help Center</Link></li>
          <li><Link to="/" className="hover:text-white transition-colors">Shipping info</Link></li>
          <li><Link to="/" className="hover:text-white transition-colors">Returns</Link></li>
          <li><Link to="/" className="hover:text-white transition-colors">Warranty</Link></li>
        </ul>
      </div>

      <div className="md:col-span-4 space-y-6">
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Newsletter</h4>
        <p className="text-sm text-gray-400">Join our newsletter and get 10% off your first tech purchase.</p>
        <div className="flex gap-2">
           <input type="email" placeholder="Your email..." className="flex-1 bg-white/5 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none h-12" />
           <Button className="amazon-button h-12">Submit</Button>
        </div>
      </div>
    </div>
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
      <p>© 2026 GADGENIX TECHNOLOGY CO. ALL RIGHTS RESERVED.</p>
      <div className="flex gap-8">
         <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
         <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [keySequence, setKeySequence] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      if (isInput) return;

      const newSequence = (keySequence + e.key.toLowerCase()).slice(-8);
      setKeySequence(newSequence);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setKeySequence('');
      }, 2000);

      if (newSequence === 'gadjenix') {
        window.location.href = '/admin/login';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [keySequence]);

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <Navbar />
        <main className="max-w-[1500px] mx-auto">
          <AnimatePresence mode="wait">
             <Routes>
               <Route path="/" element={<Home />} />
               <Route path="/products" element={<Products />} />
               <Route path="/product/:id" element={<ProductDetail />} />
               <Route path="/checkout" element={<Checkout />} />
               <Route path="/admin" element={<Admin />} />
               <Route path="/admin/login" element={<AdminLogin />} />
               <Route path="/admin/dashboard" element={<AdminDashboard />} />
               <Route path="/compare" element={<Compare />} />
             </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        <ChatAssistant />
        <CartDrawer />
        <Toaster position="top-center" expand={false} richColors />
      </div>
    </Router>
  );
}
