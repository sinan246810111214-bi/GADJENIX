import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Plus, Trash2, Edit3, Save, X, Image as ImageIcon, 
  LayoutDashboard, ShoppingBag, Settings as SettingsIcon,
  LogOut, Zap, MoreVertical, Search, Filter, Loader2, Sparkles, Wand2,
  TrendingUp, Users, DollarSign, Package, User, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { generateProductFeatures } from '@/services/geminiService';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    siteTitle: 'GADGENIX',
    logoUrl: '',
    primaryColor: '#8000FF',
    banners: []
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Product Form State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        const isAdminLocal = localStorage.getItem('isAdmin');
        if (!isAdminLocal) navigate('/admin/login');
      } else {
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'dm8115589@gmail.com,klgadjenix@gmail.com').split(',');
        if (!adminEmails.includes(u.email || '')) {
           const isAdminLocal = localStorage.getItem('isAdmin');
           if (!isAdminLocal) {
             toast.error("Unauthorized Console Access Attempt Restricted");
             navigate('/');
           }
        }
      }
    });
    
    fetchData();
    return () => unsub();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'products');
      }
      
      try {
        const sSnap = await getDoc(doc(db, 'settings', 'site_config'));
        if (sSnap.exists()) setSettings(sSnap.data());
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'settings/site_config');
      }
      
      try {
        const bSnap = await getDocs(collection(db, 'banners'));
        setBanners(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'banners');
      }

      try {
        const oSnap = await getDocs(collection(db, 'orders'));
        setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'orders');
      }
    } catch (err) {
      toast.error("Data Sync Failure");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    console.log("Initiating Upload Sequence for:", file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok && data.url) {
        console.log("Cloud Upload Successful:", data.url);
        return data.url;
      }
      
      console.warn("Cloud Upload API failed or unconfigured. Proceeding with Memory-Link fallback...");
      const base64 = await fileToBase64(file);
      toast.info("Using Local Memory: Cloud configuration missing", {
        description: "Image stored in record but not in persistent cloud storage."
      });
      return base64;
    } catch (err) {
      console.error("Upload Vector Error:", err);
      try {
        const base64 = await fileToBase64(file);
        toast.info("Using Local Memory: Integration Node Offline");
        return base64;
      } catch (b64Err) {
        toast.error("Upload Failed: Data Corruption");
        return null;
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const productData = {
      name: data.get('name'),
      price: Number(data.get('price')),
      oldPrice: Number(data.get('oldPrice')),
      category: data.get('category'),
      description: data.get('description'),
      tag: data.get('tag'),
      image: editingProduct?.image || '',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success("Product Updated");
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
        toast.success("Product Created");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${editingProduct?.id || 'new'}`);
      toast.error("Save Failed");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Abort this module permanently? (ഈ പ്രൊഡക്റ്റ് എന്നെന്നേക്കുമായി ഒഴിവാക്കണോ?)')) return;
    try {
      if (!auth.currentUser) {
        toast.error("ഗൂഗിൾ ലോഗിൻ ആവശ്യമാണ്! Please 'Login with Google' to delete products.");
        return;
      }
      await deleteDoc(doc(db, 'products', id));
      toast.success("Product Purged Successfully");
      fetchData();
    } catch (err: any) {
      console.error("Delete Error:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      } catch (jsonErr: any) {
        const info = JSON.parse(jsonErr.message);
        toast.error(`Purge Failed: ${info.error}. Please check if you are logged in correctly.`);
      }
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const bannerData = {
      title: data.get('title'),
      tagline: data.get('tagline'),
      description: data.get('description'),
      imageUrl: editingBanner?.imageUrl || '',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingBanner?.id) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerData);
        toast.success("Visual Node Updated");
      } else {
        await addDoc(collection(db, 'banners'), { ...bannerData, createdAt: serverTimestamp() });
        toast.success("Visual Node Deployed");
      }
      setShowBannerModal(false);
      setEditingBanner(null);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `banners/${editingBanner?.id || 'new'}`);
      toast.error("Deployment Failed");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Purge this visual node? (ഈ ബാനർ ഒഴിവാക്കണോ?)')) return;
    try {
      if (!auth.currentUser) {
        toast.error("ഗൂഗിൾ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക! Login with Google required.");
        return;
      }
      await deleteDoc(doc(db, 'banners', id));
      toast.success("Visual Node Terminated");
      fetchData();
    } catch (err: any) {
      console.error("Banner Delete Error:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
      } catch (jsonErr: any) {
        const info = JSON.parse(jsonErr.message);
        toast.error(`Termination Failed: ${info.error}`);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
      toast.success("Order Status Updated");
      fetchData();
    } catch (err) {
      toast.error("Status Update Failed");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Purge this order record? (ഈ ഓർഡർ ഒഴിവാക്കണോ?)')) return;
    try {
      if (!auth.currentUser) {
        toast.error("Login with Google required to delete orders.");
        return;
      }
      await deleteDoc(doc(db, 'orders', id));
      toast.success("Order Purged");
      fetchData();
    } catch (err: any) {
      console.error("Order Delete Error:", err);
      toast.error("Purge Failed");
    }
  };

  const handleGeminiFeatures = async () => {
    if (!editingProduct?.name || !editingProduct?.category) {
      toast.error("Need Name and Category for Generation");
      return;
    }
    setGenerating(true);
    try {
      const features = await generateProductFeatures(editingProduct.name, editingProduct.category);
      setEditingProduct({ ...editingProduct, description: features });
      toast.success("AI Synthesis Complete");
    } catch (err) {
      toast.error("AI Node Offline");
    } finally {
      setGenerating(false);
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'site_config'), settings);
      toast.success("Config Committed");
    } catch (err) {
      toast.error("Sync Error");
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm">
         <div className="p-10 border-b border-slate-50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                  <Zap className="w-6 h-6 text-primary fill-current" />
               </div>
               <div>
                  <h1 className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">Core Command</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Admin Interface v4.0</p>
               </div>
            </div>
         </div>

         <nav className="flex-1 p-6 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Command Center</p>
            {[
              { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
              { id: 'products', label: 'Inventory Modules', icon: ShoppingBag },
              { id: 'orders', label: 'Order Pipeline', icon: Zap },
              { id: 'banners', label: 'Visual Interface', icon: ImageIcon },
              { id: 'settings', label: 'Node Settings', icon: SettingsIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:px-6'
                }`}
              >
                 <tab.icon className="w-5 h-5" />
                 <span className="text-sm uppercase tracking-tight">{tab.label}</span>
              </button>
            ))}
         </nav>

         <div className="p-6">
            <button 
              onClick={() => { localStorage.removeItem('isAdmin'); navigate('/admin/login'); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
               <LogOut className="w-5 h-5" />
               <span className="text-sm uppercase tracking-tight">Logout Node</span>
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative p-12">
         {!user && localStorage.getItem('isAdmin') && (
           <div className="mb-10 p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-50/50">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <ShieldAlert className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black uppercase text-amber-900 tracking-tight">ലോഗിൻ വെരിഫിക്കേഷൻ ആവശ്യമാണ്</h3>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mt-1">ഡാറ്റ മാറ്റാനോ ഡിലീറ്റ് ചെയ്യാനോ (Delete/Edit) നിങ്ങൾ ഗൂഗിൾ ലോഗിൻ ഉപയോഗിക്കണം.</p>
                 </div>
              </div>
              <Button onClick={() => navigate('/admin/login')} className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-[0.2em] px-10 h-16 rounded-2xl shadow-xl shadow-amber-200/50 transition-all active:scale-95">
                 Login with Google
              </Button>
           </div>
         )}
         {activeTab === 'overview' && (
           <div className="space-y-12">
              <div className="space-y-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">System Status: Nominal</Badge>
                 <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Console Overview</h2>
                 <p className="text-slate-500 font-medium tracking-tight">Real-time telemetry from across the hardware distribution network.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                   { label: 'Total Revenue', value: `₹${orders.reduce((acc, o) => acc + (o.total || 0), 0)}`, icon: DollarSign, color: 'bg-green-500' },
                   { label: 'Active Modules', value: products.length, icon: Package, color: 'bg-blue-500' },
                   { label: 'Orders Processed', value: orders.length, icon: TrendingUp, color: 'bg-purple-500' },
                   { label: 'Pending Nodes', value: orders.filter(o => o.status === 'pending').length, icon: Loader2, color: 'bg-amber-500' },
                 ].map((stat, i) => (
                   <Card key={i} className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl transition-all">
                      <div className="flex items-start justify-between mb-6">
                         <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100`}>
                            <stat.icon className="w-6 h-6 text-white" />
                         </div>
                         <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-300">Live Telemetry</Badge>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-3xl font-black tracking-tighter uppercase">{stat.value}</h4>
                   </Card>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="lg:col-span-2 p-10 rounded-[3rem] border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-xl font-black uppercase tracking-tight">Recent Transmissions</h3>
                       <Button variant="ghost" className="text-[10px] font-black uppercase text-primary tracking-widest" onClick={() => setActiveTab('orders')}>View Full Pipeline</Button>
                    </div>
                    <div className="space-y-6">
                       {orders.slice(0, 5).map(o => (
                         <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  <Zap className="w-5 h-5 text-primary" />
                               </div>
                               <div>
                                  <p className="text-sm font-black uppercase tracking-tight">#{o.id.slice(0,8)}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{o.customer?.name}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black font-mono">₹{o.total}</p>
                               <Badge className="text-[8px] font-black uppercase px-2 py-0.5 mt-1">{o.status}</Badge>
                            </div>
                         </div>
                       ))}
                       {orders.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No Recent Data</p>}
                    </div>
                 </Card>

                 <Card className="p-10 rounded-[3rem] border-slate-100 bg-slate-900 text-white shadow-2xl">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">Quick Protocols</h3>
                    <div className="space-y-4">
                       <Button onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Audio' }); setShowProductModal(true); }} className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold uppercase text-[10px] tracking-widest justify-start px-6">
                          <Plus className="w-4 h-4 mr-4" /> Quick Deploy Module
                       </Button>
                       <Button onClick={() => setActiveTab('banners')} className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold uppercase text-[10px] tracking-widest justify-start px-6">
                          <ImageIcon className="w-4 h-4 mr-4" /> Manage Visual Nodes
                       </Button>
                       <Button onClick={() => setActiveTab('settings')} className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold uppercase text-[10px] tracking-widest justify-start px-6">
                          <SettingsIcon className="w-4 h-4 mr-4" /> System Configuration
                       </Button>
                    </div>
                    <div className="mt-12 p-6 rounded-2xl bg-primary/20 border border-primary/20">
                       <div className="flex items-center gap-3 mb-4">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Gemini Insight</p>
                       </div>
                       <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                          "Distribution efficiency has increased by 14% since the last inventory module update. Recommendation: Expand 'Audio' category."
                       </p>
                    </div>
                 </Card>
              </div>
           </div>
         )}
         {activeTab === 'products' && (
           <div className="space-y-12">
              <div className="flex items-end justify-between gap-10">
                 <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">Global Inventory</Badge>
                    <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Inventory Matrix</h2>
                    <p className="text-slate-500 font-medium">Manage hardware modules and optimize distribution protocols.</p>
                 </div>
                 <Button 
                   onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Audio' }); setShowProductModal(true); }}
                   className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                 >
                    <Plus className="mr-3 w-5 h-5" /> Deploy New Module
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                 {products.map(p => (
                   <Card key={p.id} className="group p-6 rounded-[2.5rem] border-slate-100 hover:border-primary/50 hover:shadow-3xl transition-all cursor-default">
                      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-50 mb-6 border border-slate-100/50 flex items-center justify-center">
                         {(p.imageUrl || p.image) ? (
                           <img src={p.imageUrl || p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                         ) : (
                           <ImageIcon className="w-8 h-8 text-slate-200" />
                         )}
                         <div className="absolute top-4 right-4 flex gap-2">
                            <Button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} size="icon" className="bg-white/90 backdrop-blur text-slate-900 hover:bg-primary hover:text-white rounded-xl shadow-lg h-10 w-10">
                               <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleDeleteProduct(p.id)} size="icon" className="bg-white/90 backdrop-blur text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg h-10 w-10">
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>
                      <div className="space-y-4 px-2">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</p>
                            <Badge variant="outline" className="text-[10px] font-bold py-1 px-3 border-slate-200">ID: {p.id.slice(0,6)}</Badge>
                         </div>
                         <h3 className="text-xl font-black truncate tracking-tight">{p.name}</h3>
                         <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-baseline gap-2">
                               <span className="text-2xl font-black font-mono">₹{p.price}</span>
                               {p.oldPrice > 0 && <span className="text-xs text-slate-400 line-through font-bold">₹{p.oldPrice}</span>}
                            </div>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'orders' && (
           <div className="space-y-12">
              <div className="flex items-end justify-between gap-10">
                 <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">Transaction stream</Badge>
                    <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Order Pipeline</h2>
                    <p className="text-slate-500 font-medium">Monitor active transactions and manage fulfillment sequence.</p>
                 </div>
                 <div className="flex gap-4">
                    <Card className="px-6 py-4 rounded-2xl bg-white border-slate-100 flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-slate-400">Total Revenue</p>
                          <p className="text-xl font-black">₹{orders.reduce((acc, o) => acc + (o.total || 0), 0)}</p>
                       </div>
                    </Card>
                    <Card className="px-6 py-4 rounded-2xl bg-white border-slate-100 flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-slate-400">Active Orders</p>
                          <p className="text-xl font-black">{orders.filter(o => o.status === 'pending').length}</p>
                       </div>
                    </Card>
                 </div>
              </div>

              <div className="space-y-6">
                 {orders.length === 0 ? (
                   <Card className="p-20 text-center border-dashed border-2 border-slate-100 rounded-[3rem]">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Zap className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-2xl font-black uppercase mb-2">No Transactions Detected</h3>
                      <p className="text-slate-400 font-medium">The order pipeline is currently idle.</p>
                   </Card>
                 ) : (
                   <div className="grid grid-cols-1 gap-6">
                      {orders.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(o => (
                        <Card key={o.id} className="p-8 rounded-[2.5rem] border-slate-100 hover:shadow-2xl transition-all bg-white relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                           <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
                              <div className="space-y-1 shrink-0">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                                 <h4 className="text-xl font-black font-mono">#{o.id.slice(0,8)}</h4>
                                 <Badge className={`mt-2 font-black uppercase text-[8px] px-3 py-1 ${
                                   o.status === 'completed' ? 'bg-green-500' : 
                                   o.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
                                 }`}>
                                    {o.status}
                                 </Badge>
                              </div>

                              <div className="flex-1 space-y-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                       <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black uppercase tracking-tight">{o.customer?.name || 'Anonymous User'}</p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">{o.customer?.email}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {o.items?.map((item: any, idx: number) => (
                                      <div key={idx} className="w-12 h-12 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                                         {(item.imageUrl || item.image) ? (
                                           <img src={item.imageUrl || item.image} className="w-full h-full object-contain" alt={item.name || 'Item'} />
                                         ) : (
                                           <Package className="w-4 h-4 text-slate-200" />
                                         )}
                                      </div>
                                    ))}
                                    {o.items?.length > 4 && (
                                      <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                         +{o.items.length - 4}
                                      </div>
                                    )}
                                 </div>
                              </div>

                              <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4">
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Protocol</p>
                                    <p className="text-3xl font-black font-mono">₹{o.total}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <select 
                                      value={o.status} 
                                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[10px] uppercase tracking-widest px-4 focus:ring-2 focus:ring-primary/20"
                                    >
                                       <option value="pending">Pending</option>
                                       <option value="processing">Processing</option>
                                       <option value="completed">Completed</option>
                                       <option value="cancelled">Cancelled</option>
                                    </select>
                                    <Button 
                                      onClick={() => handleDeleteOrder(o.id)}
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-10 w-10 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </div>
                           </div>
                        </Card>
                      ))}
                   </div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'banners' && (
           <div className="space-y-12">
              <div className="flex items-end justify-between gap-10">
                 <div className="space-y-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">Visual Matrix</Badge>
                    <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Banner Hub</h2>
                    <p className="text-slate-500 font-medium">Configure primary hero banners and promotional assets.</p>
                 </div>
                 <Button 
                   onClick={() => { setEditingBanner({ title: '', description: '', tagline: '', imageUrl: '' }); setShowBannerModal(true); }}
                   className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                 >
                    <Plus className="mr-3 w-5 h-5" /> Deploy Visual Node
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {banners.map(b => (
                   <Card key={b.id} className="group p-6 rounded-[2.5rem] border-slate-100 hover:border-primary/50 hover:shadow-3xl transition-all h-fit">
                      <div className="relative aspect-[21/9] rounded-3xl overflow-hidden bg-slate-50 mb-6 border border-slate-100/50 flex items-center justify-center">
                         {(b.imageUrl || b.url) ? (
                           <img src={b.imageUrl || b.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={b.title} />
                         ) : (
                           <ImageIcon className="w-10 h-10 text-slate-200" />
                         )}
                         <div className="absolute top-4 right-4 flex gap-2">
                            <Button onClick={() => { setEditingBanner(b); setShowBannerModal(true); }} size="icon" className="bg-white/90 backdrop-blur text-slate-900 hover:bg-primary hover:text-white rounded-xl shadow-lg h-10 w-10">
                               <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleDeleteBanner(b.id)} size="icon" className="bg-white/90 backdrop-blur text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-lg h-10 w-10">
                               <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>
                      <div className="space-y-3 px-2">
                         <Badge className="bg-slate-100 text-slate-400 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1">{b.tagline}</Badge>
                         <h3 className="text-2xl font-black uppercase tracking-tighter">{b.title}</h3>
                         <p className="text-slate-500 text-sm font-medium line-clamp-2">{b.description}</p>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
         )}

         {/* Settings Tab */}
         {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-12 pb-20">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black tracking-tighter uppercase">Site Configurations</h2>
                 <p className="text-slate-500">Customize global branding and deployment parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="font-black uppercase tracking-tight text-lg border-b border-slate-50 pb-6 flex items-center gap-3">
                       <LayoutDashboard className="w-5 h-5 text-primary" /> Branding
                    </h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="font-bold text-xs text-slate-400 ml-1">PLATFORM TITLE</Label>
                          <Input 
                            value={settings.siteTitle} 
                            onChange={e => setSettings({...settings, siteTitle: e.target.value})}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-bold text-xs text-slate-400 ml-1">PRIMARY HEX COLOR</Label>
                          <div className="flex gap-4">
                             <Input 
                               value={settings.primaryColor} 
                               onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                               className="h-14 rounded-2xl bg-slate-50 border-none font-bold font-mono" 
                             />
                             <div className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl" style={{ backgroundColor: settings.primaryColor }} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="font-black uppercase tracking-tight text-lg border-b border-slate-50 pb-6 flex items-center gap-3">
                       <ImageIcon className="w-5 h-5 text-primary" /> Logo Asset
                    </h3>
                    <div className="space-y-6">
                       <div className="aspect-square w-32 mx-auto bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                          {(settings.logoUrl && settings.logoUrl !== "") ? (
                             <img src={settings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
                          ) : (
                             <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                          )}
                       </div>
                       <Input 
                         type="file" 
                         className="flex-1"
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const url = await handleFileUpload(file);
                             if (url) setSettings({...settings, logoUrl: url});
                           }
                         }}
                       />
                       <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">SVG or High-Res PNG Recommended</p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end">
                 <Button 
                   onClick={saveSettings} 
                   className="h-16 px-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                 >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Save className="w-5 h-5 mr-3" />}
                    Commit Global Settings
                 </Button>
              </div>
           </div>
         )}
      </main>

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl">
           <Card className="w-full max-w-2xl rounded-[3rem] p-12 border-none shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                 <h2 className="text-2xl font-black uppercase">Configure Visual Node</h2>
                 <Button variant="ghost" onClick={() => setShowBannerModal(false)} className="rounded-xl">
                    <X className="w-5 h-5" />
                 </Button>
              </div>
              <form onSubmit={handleSaveBanner} className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Main Title</Label>
                    <Input name="title" defaultValue={editingBanner?.title} required className="h-14 rounded-xl bg-slate-50 border-none font-bold" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tagline Accents</Label>
                    <Input name="tagline" defaultValue={editingBanner?.tagline} className="h-14 rounded-xl bg-slate-50 border-none font-bold" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Narrative Description</Label>
                    <Textarea name="description" defaultValue={editingBanner?.description} className="rounded-2xl bg-slate-50 border-none font-medium text-sm p-4 min-h-[100px]" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Asset</Label>
                    <div className="flex gap-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                          {editingBanner?.imageUrl ? <img src={editingBanner.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                       </div>
                       <Input 
                         type="file"
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const url = await handleFileUpload(file);
                             if (url) setEditingBanner({...editingBanner, imageUrl: url});
                           }
                         }}
                         className="flex-1 self-center"
                       />
                    </div>
                 </div>
                 <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
                    Deploy Visual Protocol
                 </Button>
              </form>
           </Card>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl">
           <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[3rem] p-12 border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-8">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">{editingProduct?.id ? 'Update Module' : 'Configure New Module'}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{editingProduct?.id ? `Module Serial #${editingProduct.id.slice(0,8)}` : 'Initiating Hardware Registry'}</p>
                 </div>
                 <Button variant="ghost" onClick={() => setShowProductModal(false)} className="rounded-2xl w-14 h-14 hover:bg-slate-50">
                    <X className="w-6 h-6" />
                 </Button>
              </div>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-3">
                       <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Module Identity</Label>
                       <Input name="name" defaultValue={editingProduct?.name} required placeholder="Product Identification Name" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Pricing (₹)</Label>
                          <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                       </div>
                       <div className="space-y-3">
                          <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Compare At (₹)</Label>
                          <Input name="oldPrice" type="number" defaultValue={editingProduct?.oldPrice} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Category Registry</Label>
                          <select name="category" defaultValue={editingProduct?.category} className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-primary/20 px-4">
                             <option>Audio</option>
                             <option>Wearables</option>
                             <option>Accessories</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Internal Status Tag</Label>
                          <Input name="tag" defaultValue={editingProduct?.tag} placeholder="NEW, SALE, LIMITED" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Technical Specification</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            disabled={generating}
                            onClick={handleGeminiFeatures}
                            className="h-8 text-[9px] font-black uppercase text-primary hover:bg-primary/5 rounded-full px-4"
                          >
                             {generating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                             Synthesize with Gemini
                          </Button>
                       </div>
                       <Textarea 
                         name="description" 
                         defaultValue={editingProduct?.description} 
                         className="min-h-[160px] rounded-[2rem] bg-slate-50 border-none font-medium text-sm leading-relaxed p-6" 
                         placeholder="Enter hardware specifications or use AI synthesis..."
                       />
                    </div>

                    <div className="space-y-3">
                       <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Module Visualization Asset</Label>
                       <div className="flex gap-4">
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                             {editingProduct?.image ? <img src={editingProduct.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300" />}
                          </div>
                          <Input 
                            type="file" 
                            className="flex-1 self-center"
                            onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const url = await handleFileUpload(file);
                                 if (url) setEditingProduct({...editingProduct, image: url});
                               }
                            }}
                          />
                       </div>
                    </div>

                    <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                       COMMIT MODULE TO REGISTRY
                    </Button>
                 </div>
              </form>
           </Card>
        </div>
      )}
    </div>
  );
}
