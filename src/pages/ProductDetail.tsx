import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { ShoppingCart, Zap, Star, ShieldCheck, Truck, ArrowLeft, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/store';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `products/${id}`);
        }
        
        if (docSnap && docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setProduct(data);
          
          // Fetch related
          try {
            const q = query(
              collection(db, 'products'), 
              where('category', '==', data.category), 
              limit(4)
            );
            const relatedSnap = await getDocs(q);
            setRelatedProducts(relatedSnap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() })));
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, 'products');
          }
        }
      } catch (err) {
        console.error('Product fetch major error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
        <h2 className="text-4xl font-black">MODULE NOT FOUND</h2>
        <Button onClick={() => navigate('/products')}>Return to Inventory</Button>
      </div>
    );
  }

  return (
    <div className="px-8 py-12 space-y-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Gallery */}
        <div className="space-y-6">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors"
           >
              <ArrowLeft className="w-4 h-4" /> Back to Matrix
           </button>
           <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 p-12 flex items-center justify-center">
              <img 
                src={(product.imageUrl || product.image) || undefined} 
                style={{ display: (product.imageUrl || product.image) ? 'block' : 'none' }}                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500" 
                alt={product.name}
              />
           </div>
        </div>

        {/* Info */}
        <div className="space-y-10">
           <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
                 {product.category} Module
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                 {product.name}
              </h1>
              <div className="flex items-center gap-4">
                 <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                 </div>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verified Spec</span>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-baseline gap-6">
                 <span className="text-6xl font-black font-mono text-slate-900">₹{product.price}</span>
                 {product.oldPrice && (
                   <span className="text-2xl text-slate-400 line-through font-bold">₹{product.oldPrice}</span>
                 )}
              </div>
              <p className="text-slate-500 font-medium text-xl leading-relaxed">
                 {product.description || "Experimental hardware specification. High-performance throughput and optimized algorithmic processing for elite users."}
              </p>
           </div>

           <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => {
                    addItem(product);
                    toast.success(`${product.name} added to cart`);
                  }}
                  className="flex-1 h-20 rounded-[2rem] bg-slate-100 text-slate-900 border border-slate-200 font-black text-2xl hover:bg-slate-200 transition-all"
                >
                   <ShoppingCart className="mr-3 w-6 h-6" /> ADD TO CART
                </Button>
                <Button size="icon" variant="outline" className="h-20 w-20 rounded-[2rem] border-slate-200 shrink-0">
                   <Heart className="w-6 h-6" />
                </Button>
                <Button size="icon" variant="outline" className="h-20 w-20 rounded-[2rem] border-slate-200 shrink-0">
                   <Share2 className="w-6 h-6" />
                </Button>
              </div>

              <Button 
                onClick={() => {
                  addItem(product);
                  navigate('/checkout');
                }}
                className="w-full h-24 rounded-[2.5rem] bg-primary text-white font-black text-3xl shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group"
              >
                 <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 fill-current text-white animate-pulse" /> 
                    BUY NOW
                 </div>
                 <span className="text-[10px] text-white/60 tracking-[0.3em] font-bold uppercase group-hover:text-white transition-colors">Instant Acquisition Protocol</span>
              </Button>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-slate-600" />
                 </div>
                 <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Express Node</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">24h Priority Dispatch</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-slate-600" />
                 </div>
                 <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Warranty Protocol</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">12-Month Hardware Cover</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Experimental Specs */}
      <section className="bg-slate-50 rounded-[3rem] p-12 space-y-10 border border-slate-100">
         <h2 className="text-3xl font-black uppercase tracking-tight">Technical Specifications</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { label: 'Weight', value: '180g / Ultra-light' },
              { label: 'Connectivity', value: 'Bluetooth 5.4 High-Bitrate' },
              { label: 'Battery', value: '48h Latency Controlled' },
              { label: 'Drivers', value: '50mm Graphene Composite' },
              { label: 'Latency', value: 'Ultra-low <20ms' },
              { label: 'Interface', value: 'USB-C / Wireless Matrix' },
            ].map(spec => (
              <div key={spec.label} className="space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{spec.label}</p>
                 <p className="text-lg font-bold text-slate-800">{spec.value}</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}
