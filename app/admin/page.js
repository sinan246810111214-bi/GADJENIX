'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { convertToSlug } from '@/src/lib/utils';
import { 
  Plus, 
  Trash2, 
  Edit, 
  LayoutDashboard, 
  Package, 
  Image as ImageIcon, 
  Save, 
  X,
  Loader2,
  ExternalLink,
  Settings,
  Monitor,
  Search as SearchIcon,
  Globe,
  MessageSquare,
  FileCode,
  Layers,
  Eye,
  BarChart3,
  Hash,
  Share2,
  Trash,
  Cpu,
  ShoppingBag,
  Send,
  Beaker,
  List,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Smartphone,
  Tags,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster, toast } from 'sonner';

export default function GadgenixAdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'products', 'orders', 'branding', 'seo', 'categories', 'media', 'banners'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [media, setMedia] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    siteTitle: 'Gadgenix',
    metaDescription: '',
    keywords: '', // Added keywords
    whatsapp: '',
    logoUrl: '',
    faviconUrl: '',
    banners: [] // Added banners
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals / Overlays
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form State for Products
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    originalPrice: '',
    salePrice: '',
    description: '',
    category: 'Audio',
    thumbnail: '',
    gallery: [],
    specs: {}, 
    inStock: true // Added stock toggle
  });
  
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [uploading, setUploading] = useState(false);

  // Load Data
  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qCategories = query(collection(db, 'categories'));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qMedia = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubMedia = onSnapshot(qMedia, (snapshot) => {
      setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'site_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalSettings(prev => ({
          ...prev,
          ...data,
          banners: data.banners || []
        }));
      }
    };
    fetchSettings();

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCategories();
      unsubMedia();
    };
  }, []);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Product Form Actions
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: convertToSlug(name)
    }));
  };

  const addSpec = () => {
    if (!newSpec.key || !newSpec.value) return;
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [newSpec.key]: newSpec.value }
    }));
    setNewSpec({ key: '', value: '' });
  };

  const removeSpec = (key) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData(prev => ({ ...prev, specs: newSpecs }));
  };

  // Cloudinary Upload Logic
  const handleCloudinaryUpload = async (e, type = 'gallery') => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) throw new Error('Cloudinary integration failure');
        
        const data = await response.json();
        const url = data.url;
        
        uploadedUrls.push(url);
      } catch (error) {
        toast.error(`Upload failure: ${file.name}`);
        console.error(error);
      }
    }

    if (type === 'gallery') {
      setFormData(prev => ({
       ...prev,
       gallery: [...prev.gallery, ...uploadedUrls],
       thumbnail: prev.thumbnail || uploadedUrls[0]
      }));
    } else if (type === 'logo' || type === 'favicon') {
      setGlobalSettings(prev => ({
       ...prev,
       [type === 'logo' ? 'logoUrl' : 'faviconUrl']: uploadedUrls[0]
      }));
    } else if (type === 'thumbnail') {
      setFormData(prev => ({ ...prev, thumbnail: uploadedUrls[0] }));
    } else if (type === 'banner') {
      const newBanners = uploadedUrls.map(url => ({ url, link: '', id: Date.now() + Math.random() }));
      setGlobalSettings(prev => ({ ...prev, banners: [...(prev.banners || []), ...newBanners] }));
    }

    // Track in Media Collection
    for (const url of uploadedUrls) {
      await addDoc(collection(db, 'media'), {
        url,
        createdAt: new Date().toISOString()
      });
    }

    setUploading(false);
    toast.success("Assets synchronized via Cloudinary CDN");
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const productData = {
      ...formData,
      price: parseFloat(formData.salePrice || formData.originalPrice || 0),
      originalPrice: parseFloat(formData.originalPrice || 0),
      salePrice: parseFloat(formData.salePrice || 0),
      updatedAt: new Date().toISOString(),
      inStock: formData.inStock ?? true
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success("Product updated in Firestore");
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        toast.success("New product indexed successfully");
      }
      setShowProductModal(false);
      resetProductForm();
    } catch (error) {
      toast.error("Process failure: Check connection");
    } finally {
      setUploading(false);
    }
  };

  const resetProductForm = () => {
    setFormData({
      name: '',
      slug: '',
      originalPrice: '',
      salePrice: '',
      description: '',
      category: categories[0]?.name || 'Audio',
      thumbnail: '',
      gallery: [],
      specs: {},
      inStock: true
    });
    setEditingProduct(null);
  };

  const startEditProduct = (p) => {
    setEditingProduct(p);
    setFormData({
      ...p,
      originalPrice: p.originalPrice?.toString() || '',
      salePrice: p.salePrice?.toString() || ''
    });
    setShowProductModal(true);
  };

  const deleteProduct = async (id) => {
    if (confirm("WARNING: Are you sure you want to permanently delete this product and its associated data? This action cannot be undone.")) {
      await deleteDoc(doc(db, 'products', id));
      toast.info("Registry entry removed");
    }
  };

  const deleteOrder = async (id) => {
    if (confirm("Permanently remove this order record from the archive?")) {
      await deleteDoc(doc(db, 'orders', id));
      toast.info("Order record purged");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success(`Order status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const saveCategory = async (catName) => {
    if (!catName) return;
    try {
      await addDoc(collection(db, 'categories'), { name: catName, createdAt: new Date().toISOString() });
      toast.success("Category created");
    } catch (err) {
      toast.error("Failed to create category");
    }
  };

  const deleteCategory = async (id) => {
    if (confirm("Delete this category?")) {
      await deleteDoc(doc(db, 'categories', id));
      toast.info("Category removed");
    }
  };

  const removeBanner = (index) => {
    const newBanners = [...globalSettings.banners];
    newBanners.splice(index, 1);
    setGlobalSettings({ ...globalSettings, banners: newBanners });
  };

  const handleTestOrder = async () => {
    setUploading(true);
    const dummyOrder = {
      customer: {
        fullName: 'Test User (Diagnostic)',
        phone: '+91 99999 88888',
        houseName: 'Gadgenix HQ',
        location: 'Admin Terminal',
        pincode: '670001',
        landmark: 'Main Hub'
      },
      items: [
        { name: 'P9 Headset', quantity: 1, price: '₹1499' }
      ],
      totalPrice: '₹1499'
    };

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyOrder)
      });

      if (response.ok) {
        toast.success("Test order cycle initialized. Check klgadjenix@gmail.com");
      } else {
        throw new Error('Test cycle failed');
      }
    } catch (error) {
      toast.error("Diagnostic failure: Check EMAIL credentials");
    } finally {
      setUploading(false);
    }
  };

  const saveSiteSettings = async () => {
    setUploading(true);
    try {
      await setDoc(doc(db, 'settings', 'site_config'), globalSettings);
      toast.success("Site configuration committed");
    } catch (err) {
      toast.error("Settings sync failure");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden font-sans selection:bg-primary/20">
      <Toaster richColors position="top-right" />
      
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-50">
        <div className="p-10">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10">
                 <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">GADGENIX</h2>
                 <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1.5 uppercase opacity-50">Master Terminal</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-6 space-y-1 overflow-y-auto pb-10">
           {[
             { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
             { id: 'products', label: 'Tech Inventory', icon: Package },
             { id: 'orders', label: 'Sales Registry', icon: ShoppingBag },
             { id: 'categories', label: 'Taxonomy (Categories)', icon: List },
             { id: 'branding', label: 'Site Branding', icon: ImageIcon },
             { id: 'banners', label: 'Hero Matrices (Banners)', icon: Layout },
             { id: 'media', label: 'Cloud Gallery', icon: FileCode },
             { id: 'seo', label: 'SEO Analytics', icon: BarChart3 },
             { id: 'settings', label: 'System Settings', icon: Settings },
           ].map(item => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.8rem] text-sm font-black transition-all group ${
                 activeTab === item.id 
                 ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                 : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
               }`}
             >
               <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'group-hover:text-slate-900'}`} />
               {item.label}
             </button>
           ))}
        </nav>

        <div className="p-8">
           <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-slate-400">Environment Active</span>
              </div>
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl border-slate-200 hover:border-primary hover:bg-white text-[10px] font-black track-widest">
                 <a href="/" target="_blank">LIVE PREVIEW <ExternalLink className="w-3.5 h-3.5 ml-2" /></a>
              </Button>
           </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col h-full bg-[#F5F7FA] overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-12 sticky top-0 z-40">
           <div>
              <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] px-3 py-1 mb-1">STABLE RELEASE V1.2</Badge>
              <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">
                 {activeTab} Management
              </h1>
           </div>
           
           <div className="flex items-center gap-5">
              {activeTab === 'products' && (
                <div className="relative group">
                   <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                   <input 
                     placeholder="QUERY REGISTRY..." 
                     className="bg-slate-100 h-12 pl-12 pr-6 rounded-2xl border-none text-[11px] font-black focus:ring-2 focus:ring-primary/20 w-80 transition-all outline-none"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
              )}
              {activeTab === 'products' && (
                <Button onClick={() => setShowProductModal(true)} className="h-12 rounded-2xl px-8 bg-primary font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                   INITIALIZE ASSET
                </Button>
              )}
           </div>
        </header>

        <ScrollArea className="flex-1 p-12">
           {/* DASHBOARD VIEW */}
           {activeTab === 'dashboard' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   {[
                     { label: 'Total Assets', val: products.length, icon: Package, color: 'text-primary' },
                     { label: 'Total Volume', val: orders.length, icon: ShoppingBag, color: 'text-blue-500' },
                     { label: 'Cloud Media', val: media.length, icon: ImageIcon, color: 'text-purple-500' },
                     { label: 'Stock Alerts', val: products.filter(p => !p.inStock).length, icon: AlertTriangle, color: 'text-red-500' },
                   ].map((stat, i) => (
                     <Card key={i} className="p-8 border-none shadow-sm rounded-[2.5rem] bg-white">
                        <div className="flex items-center justify-between mb-6">
                           <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>
                              <stat.icon className="w-6 h-6" />
                           </div>
                           <Badge variant="secondary" className="bg-slate-50 text-slate-300 text-[9px] font-black">SYNCED</Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{stat.label}</p>
                        <h4 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{stat.val}</h4>
                     </Card>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <Card className="lg:col-span-8 p-10 border-none shadow-sm rounded-[3rem] bg-white">
                      <div className="flex items-center justify-between mb-10">
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Registry Inflow</h3>
                         <Button variant="ghost" onClick={() => setActiveTab('products')} className="text-[10px] font-black uppercase tracking-widest hover:text-primary">View Full Archive</Button>
                      </div>
                      <div className="space-y-4">
                         {products.slice(0, 5).map(p => (
                           <div key={p.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-primary transition-all">
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 bg-white rounded-2xl p-2 border border-slate-100 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                    <img src={p.thumbnail || p.image} className="w-full h-full object-contain" alt="" />
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{p.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.category} | ${p.price}</p>
                                 </div>
                              </div>
                              <Badge className={`${p.inStock ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} border-none text-[8px] font-black uppercase px-3 py-1.5`}>
                                 {p.inStock ? 'Available' : 'Zero Inventory'}
                              </Badge>
                           </div>
                         ))}
                      </div>
                   </Card>

                   <Card className="lg:col-span-4 p-10 border-none shadow-sm rounded-[3rem] bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
                      <div>
                         <div className="bg-primary/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 border border-primary/20">
                            <Cpu className="w-8 h-8 text-primary" />
                         </div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">System Maintenance</h3>
                         <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Execute diagnostic cycles to verify Nodemailer integration, Cloudinary performance, and Firebase relational integrity.</p>
                      </div>
                      <div className="space-y-4 pt-6 border-t border-white/10 relative z-10">
                        <Button variant="outline" onClick={handleTestOrder} disabled={uploading} className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-white font-black text-[11px] uppercase tracking-widest gap-3 active:scale-95 transition-all">
                           {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-green-400" />}
                           Run Diagnostic Order
                        </Button>
                        <Button variant="outline" className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-white font-black text-[11px] uppercase tracking-widest gap-3 active:scale-95 transition-all">
                           <Beaker className="w-4 h-4 text-primary" />
                           Audit Cloud Assets
                        </Button>
                      </div>
                      <div className="absolute -right-16 -bottom-16 opacity-[0.05]">
                         <Settings className="w-64 h-64" />
                      </div>
                   </Card>
                </div>
             </div>
           )}

           {/* PRODUCTS VIEW */}
           {activeTab === 'products' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-right-5 duration-500">
                <div className="grid grid-cols-1 gap-6">
                   {loading ? (
                     <div className="h-96 flex flex-col items-center justify-center gap-5">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">Compiling Assets...</p>
                     </div>
                   ) : filteredProducts.length === 0 ? (
                     <div className="h-96 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-20">
                        <Layers className="w-20 h-20 text-slate-100 mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zero Registry Hits</h3>
                        <p className="text-slate-400 max-w-md text-sm font-medium mt-4 uppercase tracking-widest leading-relaxed">The current query parameters yield no stored technological resources in the cloud database.</p>
                     </div>
                   ) : (
                     <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-200">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Technological Resource</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Financial Node</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">State</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Operation Terminal</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {filteredProducts.map(p => (
                                <tr key={p.id} className="group hover:bg-slate-50 transition-all duration-300">
                                   <td className="px-10 py-8">
                                      <div className="flex items-center gap-6">
                                         <div className="w-16 h-16 bg-slate-50 rounded-2xl p-3 flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                            <img src={p.thumbnail || p.image} className="w-full h-full object-contain" alt="" />
                                         </div>
                                         <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{p.name}</p>
                                            <p className="text-[10px] font-mono text-primary font-bold opacity-60">/{p.slug}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-10 py-8">
                                      <div className="flex flex-col">
                                         <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">${p.salePrice || p.price}</span>
                                         {p.originalPrice > 0 && <span className="text-[10px] font-bold text-slate-300 line-through">${p.originalPrice}</span>}
                                      </div>
                                   </td>
                                   <td className="px-10 py-8">
                                      <Badge variant="outline" className="border-slate-200 text-slate-400 text-[9px] font-black rounded-full px-3">{p.category}</Badge>
                                   </td>
                                   <td className="px-10 py-8 text-right">
                                      <div className="flex items-center justify-end gap-3">
                                         <Button variant="ghost" size="icon" onClick={() => startEditProduct(p)} className="h-12 w-12 rounded-2xl hover:bg-white hover:text-primary hover:shadow-xl transition-all">
                                            <Edit className="w-4.5 h-4.5" />
                                         </Button>
                                         <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="h-12 w-12 rounded-2xl hover:bg-white hover:text-red-500 hover:shadow-xl transition-all">
                                            <Trash2 className="w-4.5 h-4.5" />
                                         </Button>
                                         <Button asChild variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white hover:text-slate-900 hover:shadow-xl transition-all">
                                            <a href={`/product/${p.slug}`} target="_blank"><Eye className="w-4.5 h-4.5" /></a>
                                         </Button>
                                      </div>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
             </div>
           )}

           {/* ORDERS VIEW */}
           {activeTab === 'orders' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-200">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                               <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">Order ID & Date</th>
                               <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">Customer Details</th>
                               <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">Inventory Units</th>
                               <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400">Transaction Value</th>
                               <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 && (
                              <tr>
                                 <td colSpan="5" className="px-10 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                       <ShoppingBag className="w-16 h-16 opacity-20" />
                                       <p className="text-sm font-black uppercase tracking-widest">No order cycles detected in registry</p>
                                    </div>
                                 </td>
                              </tr>
                            )}
                            {orders.map(order => (
                              <tr key={order.id} className="group hover:bg-slate-50 transition-all duration-300">
                                 <td className="px-10 py-8">
                                    <div className="space-y-1">
                                       <p className="text-xs font-black text-slate-900 font-mono tracking-tighter">#{order.id.slice(0, 8).toUpperCase()}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'} | {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}</p>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="space-y-1">
                                       <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.customer?.fullName || 'N/A'}</p>
                                       <p className="text-[10px] font-bold text-primary flex items-center gap-2">
                                          <MessageSquare className="w-3 h-3" /> {order.customer?.phone}
                                       </p>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="flex flex-col gap-1">
                                       {order.items?.map((item, idx) => (
                                         <Badge key={idx} variant="secondary" className="bg-slate-100 text-[9px] font-bold py-0.5 px-2 w-fit">
                                            {item.quantity}x {item.name}
                                         </Badge>
                                       ))}
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">
                                       ${parseFloat(order.totalPrice || 0).toFixed(2)}
                                    </span>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-3">
                                       <select 
                                          value={order.status || 'pending'} 
                                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                          className={`bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase px-3 py-2 outline-none cursor-pointer hover:bg-slate-200 transition-colors ${
                                             order.status === 'delivered' ? 'text-green-600' : 
                                             order.status === 'shipped' ? 'text-blue-600' : 'text-amber-600'
                                          }`}
                                       >
                                          <option value="pending">PENDING</option>
                                          <option value="shipped">SHIPPED</option>
                                          <option value="delivered">DELIVERED</option>
                                       </select>
                                       <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)} className="h-10 w-10 rounded-xl hover:bg-white hover:text-red-500 hover:shadow-xl transition-all">
                                          <Trash2 className="w-4 h-4" />
                                       </Button>
                                    </div>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
           )}

           {/* BRANDING VIEW */}
           {activeTab === 'branding' && (
             <div className="max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-sm rounded-[3rem] p-12 bg-white">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-10">
                         <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Terminal Branding Parameters</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-60">Synchronize visual assets across the Gadgenix network.</p>
                         </div>
                         
                         <div className="space-y-8">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Site Identity Logo</p>
                               <div className="aspect-video bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 relative group overflow-hidden hover:border-primary transition-all">
                                  {globalSettings.logoUrl ? (
                                    <img src={globalSettings.logoUrl} className="w-full h-full object-contain drop-shadow-2xl" alt="Logo" />
                                  ) : (
                                    <Monitor className="w-16 h-16 text-slate-100" />
                                  )}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                     {uploading ? <Loader2 className="w-10 h-10 animate-spin text-white" /> : <Plus className="w-10 h-10 text-white" />}
                                     <span className="text-[10px] text-white font-black mt-3 uppercase tracking-widest">Update Asset</span>
                                  </div>
                                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCloudinaryUpload(e, 'logo')} disabled={uploading} />
                               </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                               <div className="flex items-center gap-4">
                                  <MessageSquare className="w-6 h-6 text-primary" />
                                  <div className="flex-1 space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Comm link (WhatsApp)</label>
                                     <Input value={globalSettings.whatsapp} onChange={(e) => setGlobalSettings({...globalSettings, whatsapp: e.target.value})} className="h-14 rounded-2xl border-slate-200 font-bold" placeholder="+1234567890" />
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-10">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest text-center">Environment Favicon (SEO Node)</p>
                            <div className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 relative group overflow-hidden hover:border-primary transition-all max-w-[280px] mx-auto">
                               {globalSettings.faviconUrl ? (
                                 <img src={globalSettings.faviconUrl} className="w-24 h-24 object-contain" alt="Favicon" />
                               ) : (
                                 <FileCode className="w-20 h-20 text-slate-100" />
                               )}
                               <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                  {uploading ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : <Plus className="w-8 h-8 text-white" />}
                                  <span className="text-[9px] text-white font-black mt-2 uppercase tracking-widest">Patch Icon</span>
                               </div>
                               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCloudinaryUpload(e, 'favicon')} disabled={uploading} />
                            </div>
                            <p className="text-[10px] italic text-slate-400 text-center mt-6 uppercase tracking-tighter leading-relaxed">System only supports .ico, .png, and .svg nodes for favicon indexing.</p>
                         </div>
                      </div>
                   </div>

                   <Button onClick={saveSiteSettings} disabled={uploading} className="w-full h-16 rounded-[2rem] mt-16 font-black text-lg shadow-2xl shadow-primary/30 group">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />}
                      COMMIT BRANDING SYNCHRONIZATION
                   </Button>
                </Card>
             </div>
           )}

           {/* CATEGORIES VIEW */}
           {activeTab === 'categories' && (
             <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <Card className="p-10 border-none shadow-sm rounded-[3rem] bg-white">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Taxonomy Management</h3>
                         <Button onClick={() => setShowCategoryModal(true)} className="h-10 rounded-xl bg-slate-900 font-black text-[10px] uppercase px-6">New Category</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {categories.map(cat => (
                           <div key={cat.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-primary transition-all">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{cat.name}</span>
                              <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="rounded-xl text-slate-400 hover:text-red-500">
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                         ))}
                      </div>
                   </div>
                </Card>
             </div>
           )}

           {/* BANNERS VIEW */}
           {activeTab === 'banners' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <Card className="p-10 border-none shadow-sm rounded-[3rem] bg-white">
                   <div className="space-y-10">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hero Matrices (Home Banners)</h3>
                         <div className="relative">
                            <Button className="h-10 rounded-xl bg-primary font-black text-[10px] uppercase px-6 shadow-xl shadow-primary/20">Upload New Matrix</Button>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleCloudinaryUpload(e, 'banner')} multiple />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {globalSettings.banners?.map((banner, idx) => (
                           <Card key={banner.id} className="group relative rounded-[2.5rem] overflow-hidden border-none shadow-lg">
                              <img src={banner.url} className="w-full aspect-[21/9] object-cover" alt="" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                 <Button variant="ghost" size="icon" onClick={() => removeBanner(idx)} className="h-12 w-12 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-red-500">
                                    <Trash2 className="w-5 h-5" />
                                 </Button>
                              </div>
                              <div className="absolute bottom-4 left-4 right-4">
                                 <Input 
                                    className="h-10 rounded-xl bg-white/90 backdrop-blur-md border-none text-[10px] font-bold placeholder:text-slate-400" 
                                    placeholder="Destination Link (URL)..."
                                    value={banner.link}
                                    onChange={(e) => {
                                       const newBanners = [...globalSettings.banners];
                                       newBanners[idx].link = e.target.value;
                                       setGlobalSettings({...globalSettings, banners: newBanners});
                                    }}
                                 />
                              </div>
                           </Card>
                         ))}
                      </div>
                      
                      <Button onClick={saveSiteSettings} className="w-full h-14 rounded-2xl font-black text-sm">COMMIT MATRICES SYNC</Button>
                   </div>
                </Card>
             </div>
           )}

           {/* MEDIA VIEW */}
           {activeTab === 'media' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {media.map(item => (
                     <Card key={item.id} className="aspect-square rounded-[2rem] overflow-hidden group border-none shadow-sm relative">
                        <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                           <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(item.url); toast.info("Link copied to clipboard"); }} className="text-white text-[9px] font-black uppercase">Copy URL</Button>
                           <Button variant="ghost" onClick={() => deleteDoc(doc(db, 'media', item.id))} className="text-red-400 text-[9px] font-black uppercase mt-2">Prurge</Button>
                        </div>
                     </Card>
                   ))}
                </div>
             </div>
           )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                 <Card className="border-none shadow-sm rounded-[3rem] p-12 bg-white">
                    <div className="space-y-12">
                       <div className="space-y-3 border-l-4 border-green-500 pl-10">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Global System Protocols</h3>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Control the fundamental operating parameters of the storefront matrix.</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">WhatsApp Business Interface</label>
                             <Input value={globalSettings.whatsapp || ''} onChange={(e) => setGlobalSettings({...globalSettings, whatsapp: e.target.value})} placeholder="+91 XXXXXXXXXX" className="h-16 pl-16 rounded-[1.5rem] bg-slate-50 border-slate-200 font-bold text-lg focus:bg-white transition-all shadow-inner" />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Support Core (Email)</label>
                             <Input value={globalSettings.supportEmail || ''} onChange={(e) => setGlobalSettings({...globalSettings, supportEmail: e.target.value})} placeholder="admin@gadgenix.com" className="h-16 pl-16 rounded-[1.5rem] bg-slate-50 border-slate-200 font-bold text-lg focus:bg-white transition-all shadow-inner" />
                          </div>
                       </div>
                       <Button onClick={saveSiteSettings} disabled={uploading} className="w-full h-18 rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 group bg-slate-900 hover:bg-slate-800 transition-all">
                          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-5 h-5 mr-4 group-hover:rotate-12 transition-transform" />}
                          INITIALIZE SYSTEM SYNC
                       </Button>
                    </div>
                 </Card>
              </div>
            )}

           {/* SEO VIEW */}
           {activeTab === 'seo' && (
             <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-sm rounded-[3rem] p-12 bg-white">
                   <div className="space-y-12">
                      <div className="space-y-3 border-l-4 border-primary pl-10">
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Search Logic & Analytics Parameters</h3>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Control how the digital environment is perceived by search engine algorithms.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-10">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Master Site Title Template</label>
                            <Input value={globalSettings.siteTitle} onChange={(e) => setGlobalSettings({...globalSettings, siteTitle: e.target.value})} className="h-16 rounded-[1.5rem] border-slate-200 font-bold text-lg" placeholder="e.g. Gadgenix | Premium Technology" />
                         </div>
                         
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Digital Keywords (SEO Tags)</label>
                            <Input value={globalSettings.keywords || ''} onChange={(e) => setGlobalSettings({...globalSettings, keywords: e.target.value})} className="h-16 rounded-[1.5rem] border-slate-200 font-bold text-sm" placeholder="e.g. tech, gadgets, wireless, audio" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase ml-2">Comma separated indexing nodes.</p>
                         </div>
                         
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Meta Description Indexing (Crawler Instructions)</label>
                            <textarea className="w-full rounded-[2.5rem] border border-slate-200 p-8 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 min-h-[220px] transition-all bg-slate-50 focus:bg-white" value={globalSettings.metaDescription} onChange={(e) => setGlobalSettings({...globalSettings, metaDescription: e.target.value})} placeholder="Synthesize your core brand story for optimized crawler indexing..." />
                            <div className="flex justify-between px-6">
                               <span className="text-[9px] font-bold text-slate-300 uppercase">Recommended: 150-160 characters</span>
                               <span className="text-[9px] font-black text-primary uppercase">{globalSettings.metaDescription.length} Units</span>
                            </div>
                         </div>
                      </div>

                      <Button onClick={saveSiteSettings} disabled={uploading} className="w-full h-16 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/30">
                         {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <BarChart3 className="w-5 h-5 mr-3" />}
                         COMMIT ANALYTICS UPDATE
                      </Button>
                   </div>
                </Card>

                <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex items-center justify-between">
                   <div className="space-y-2">
                      <p className="text-xl font-black uppercase">Search Preview Node</p>
                      <p className="text-slate-400 font-mono text-[10px] max-w-lg leading-relaxed lowercase">Current synthesis: google.com/search?q={globalSettings.siteTitle.replace(/\s+/g, '+')}</p>
                   </div>
                   <div className="p-4 bg-white/10 rounded-3xl border border-white/5">
                      <ExternalLink className="w-8 h-8 text-primary" />
                   </div>
                </div>
             </div>
           )}
        </ScrollArea>
      </main>

      {/* PRODUCT INITIALIZATION MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 animate-in fade-in duration-500 overflow-hidden">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowProductModal(false)} />
           <Card className="w-full max-w-6xl bg-white rounded-[4rem] shadow-2xl relative z-10 overflow-hidden max-h-[95vh] flex flex-col border-none animate-in zoom-in-95 duration-500">
              <header className="p-10 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                 <div>
                    <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase mb-2">Registry Command</Badge>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                       {editingProduct ? 'Resource Re-Initialization' : 'New Asset Protocol'}
                    </h2>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowProductModal(false)} className="h-14 w-14 rounded-full hover:bg-slate-100 transition-all">
                    <X className="w-8 h-8" />
                 </Button>
              </header>

              <ScrollArea className="flex-1 p-12">
                 <form id="product-form" onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-12 gap-16">
                    <div className="md:col-span-8 space-y-16">
                       <section className="space-y-8">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary border-l-4 border-primary pl-6">Core Identity Node</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest ml-1">Asset Nomenclature (Name)</label>
                                <Input required value={formData.name} onChange={handleNameChange} className="h-16 rounded-[1.5rem] border-slate-200 font-bold" placeholder="GADGENIX PRO X-1" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest ml-1">Domain Slug (Editable Access)</label>
                                <div className="relative">
                                   <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                   <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="h-16 pl-14 rounded-[1.5rem] border-slate-200 font-mono text-[11px] font-black text-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-900 tracking-widest ml-1">System Technical Narrative (Description)</label>
                             <textarea required className="w-full rounded-[2.5rem] border border-slate-200 p-8 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 min-h-[200px] bg-slate-50 focus:bg-white transition-all" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Synthesize technical specifications and product capability narratives..." />
                          </div>
                       </section>

                       <section className="space-y-8">
                          <div className="flex items-center justify-between">
                             <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary border-l-4 border-primary pl-6">Technical Architecture (Specs)</h3>
                             <Button type="button" onClick={() => setNewSpec({ key: '', value: '' })} className="bg-slate-100 text-slate-900 hover:bg-slate-200 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                Expand Schema
                             </Button>
                          </div>
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <Input placeholder="PROPERTY (e.g. Battery)" value={newSpec.key} onChange={(e) => setNewSpec({...newSpec, key: e.target.value})} className="h-14 border-slate-200 rounded-2xl font-black uppercase text-[11px] bg-white" />
                             <div className="flex gap-4">
                                <Input placeholder="VALUE (e.g. 50 Hours)" value={newSpec.value} onChange={(e) => setNewSpec({...newSpec, value: e.target.value})} className="h-14 border-slate-200 rounded-2xl font-bold text-[11px] bg-white" />
                                <Button type="button" onClick={addSpec} className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/20"><Plus className="w-5 h-5" /></Button>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {Object.entries(formData.specs).map(([k, v]) => (
                               <div key={k} className="flex justify-between items-center bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm transition-all group hover:border-primary">
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{k}</span>
                                     <span className="text-[13px] font-black text-slate-900 leading-tight uppercase">{v}</span>
                                  </div>
                                  <button type="button" onClick={() => removeSpec(k)} className="text-red-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
                                     <Trash className="w-5 h-5" />
                                  </button>
                               </div>
                             ))}
                             {Object.keys(formData.specs).length === 0 && (
                               <div className="col-span-full py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-200">
                                  <Layers className="w-10 h-10 mb-3" />
                                  <p className="text-[9px] font-black uppercase tracking-widest">No Technical Rows Initialized</p>
                               </div>
                             )}
                          </div>
                       </section>

                       <section className="space-y-8">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary border-l-4 border-primary pl-6">Cloud Visual Matrix (Gallery)</h3>
                          <div className="flex flex-wrap gap-6">
                             <label className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-white transition-all group shrink-0 shadow-sm">
                                {uploading ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Plus className="w-8 h-8 text-slate-200 group-hover:text-primary transition-colors" />}
                                <span className="text-[9px] font-black uppercase text-slate-400 mt-3 tracking-widest">Upload Asset</span>
                                <input type="file" multiple className="hidden" onChange={(e) => handleCloudinaryUpload(e, 'gallery')} disabled={uploading} />
                             </label>
                             {formData.gallery.map((url, i) => (
                               <div key={i} className={`relative w-32 h-32 bg-white border-2 rounded-[2.5rem] p-3 shrink-0 group transition-all shadow-sm ${formData.thumbnail === url ? 'ring-4 ring-primary ring-offset-4 border-primary' : 'border-slate-50'}`}>
                                  <img src={url} className="w-full h-full object-contain" alt="" />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 rounded-[2.5rem] flex flex-col items-center justify-center transition-all px-4">
                                     <button type="button" onClick={() => setFormData({...formData, thumbnail: url})} className="text-[9px] font-black bg-white text-slate-900 px-4 py-2 rounded-full mb-3 uppercase tracking-tighter w-full active:scale-95 transition-transform">Initialize Thumb</button>
                                     <button type="button" onClick={() => setFormData({...formData, gallery: formData.gallery.filter(u => u !== url), thumbnail: formData.thumbnail === url ? '' : formData.thumbnail})} className="text-white hover:text-red-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" /> Purge
                                     </button>
                                  </div>
                                  {formData.thumbnail === url && (
                                    <div className="absolute -top-3 -right-3 bg-primary text-white p-2 rounded-full shadow-2xl border-4 border-white animate-in zoom-in-50 duration-300">
                                       <Check className="w-4 h-4" />
                                    </div>
                                  )}
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>

                    <div className="md:col-span-4 space-y-16">
                       <section className="space-y-8">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary border-l-4 border-primary pl-6">Financial Node</h3>
                          <div className="space-y-8 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/10">
                             <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Archive Listing Price</label>
                                <Input required type="number" step="0.01" value={formData.originalPrice} onChange={(e) => setFormData({...formData, originalPrice: e.target.value})} className="h-16 bg-white/10 border-white/10 rounded-[1.2rem] font-mono text-xl font-black text-white focus:bg-white/20 transition-all outline-none" placeholder="0.00" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1">Current Sale Allocation</label>
                                <Input type="number" step="0.01" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: e.target.value})} className="h-16 bg-primary/10 border-primary/20 rounded-[1.2rem] font-mono text-xl font-black text-primary focus:bg-primary/20 transition-all outline-none" placeholder="0.00" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry Classification</label>
                                <select className="w-full h-16 rounded-[1.2rem] border border-white/10 bg-white/5 px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:bg-white/10 transition-all appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                   {categories.map(c => <option key={c.id} value={c.name} className="bg-slate-900">{c.name.toUpperCase()}</option>)}
                                   {categories.length === 0 && (
                                     ['Audio', 'Wearables', 'Peripherals', 'Accessories'].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                                   )}
                                </select>
                             </div>
                          </div>
                       </section>

                       <section className="space-y-8">
                          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary border-l-4 border-primary pl-6">Holographic Preview</h3>
                          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-2xl hover:shadow-slate-200 transition-all hover:scale-105 duration-500">
                             <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] p-8 flex items-center justify-center mb-8 overflow-hidden border border-slate-50 group-hover:p-4 transition-all duration-700">
                                {formData.thumbnail || formData.gallery[0] ? (
                                  <img src={formData.thumbnail || formData.gallery[0]} className="w-full h-full object-contain drop-shadow-2xl" alt="Preview" />
                                ) : (
                                  <ImageIcon className="w-16 h-16 text-slate-100" />
                                )}
                             </div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{formData.category}</p>
                             <h4 className="text-xl font-black uppercase tracking-tight line-clamp-2 leading-tight px-4">{formData.name || 'NEW SYSTEM RESOURCE'}</h4>
                             <div className="mt-4 flex items-center gap-3">
                                <span className="text-2xl font-black text-primary font-mono">${formData.salePrice || formData.originalPrice || '0.00'}</span>
                                {formData.originalPrice > 0 && formData.salePrice > 0 && (
                                   <span className="text-sm font-bold text-slate-200 line-through font-mono">${formData.originalPrice}</span>
                                )}
                             </div>
                          </div>
                       </section>
                    </div>
                 </form>
              </ScrollArea>

              <footer className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-5 sticky bottom-0 z-20">
                 <Button type="button" variant="ghost" onClick={() => setShowProductModal(false)} className="h-16 rounded-[1.5rem] px-12 font-black uppercase text-[11px] tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Abort Registry Protocol</Button>
                 <Button form="product-form" type="submit" disabled={uploading} className="h-16 rounded-[1.5rem] px-16 font-black text-base shadow-2xl shadow-primary/30 active:scale-95 transition-transform">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    ) : (
                      <Save className="w-6 h-6 mr-4" />
                    )}
                    {editingProduct ? 'COMMIT ARCHIVE MODIFICATION' : 'INITIALIZE SYSTEM INDEXING'}
                 </Button>
              </footer>
           </Card>
        </div>
      )}
      {/* CATEGORY INITIALIZATION MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
           <Card className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl relative z-10 p-10 border-none animate-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Refine Taxonomy</h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Category Nomenclature</label>
                    <Input id="cat-input" className="h-14 rounded-2xl border-slate-200 font-black" placeholder="AUDIO, WEARABLES, ETC." />
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setShowCategoryModal(false)} className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase">Cancel</Button>
                    <Button onClick={() => {
                       const name = document.getElementById('cat-input').value;
                       saveCategory(name);
                       setShowCategoryModal(false);
                    }} className="flex-1 h-14 rounded-2xl bg-slate-900 font-black text-[11px] uppercase">Initialize Node</Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
