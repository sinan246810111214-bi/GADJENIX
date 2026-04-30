import { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Search, SlidersHorizontal, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useSearchParams } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q = collection(db, 'products');
        
        let snapshots;
        try {
          if (categoryFilter) {
            snapshots = await getDocs(query(q, where('category', '==', categoryFilter)));
          } else {
            snapshots = await getDocs(q);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'products');
        }

        if (snapshots) {
          let results = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (searchQuery) {
            const s = searchQuery.toLowerCase();
            results = results.filter(p => 
              p.name?.toLowerCase().includes(s) || 
              p.description?.toLowerCase().includes(s) ||
              p.category?.toLowerCase().includes(s)
            );
          }

          setProducts(results);
        }
      } catch (err) {
        console.error('Products fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter, searchQuery]);

  return (
    <div className="px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
            Inventory Matrix
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            {categoryFilter || 'All Modules'}
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-lg">
            Authorized hardware distribution for next-gen consumer electronics and precision modules.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-bold px-8">
              <SlidersHorizontal className="w-5 h-5 mr-3" /> Filters
           </Button>
           <div className="relative group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search database..." 
                className="h-14 pl-12 pr-6 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm w-64 focus:w-80 transition-all"
              />
           </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {products.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`}>
                <div className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
                   <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl bg-slate-50">
                      <img 
                         src={product.imageUrl || product.image || undefined} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                         style={{ display: (product.imageUrl || product.image) ? 'block' : 'none' }}                        alt={product.name}
                      />
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
                   <div className="mt-6">
                      <Button className="w-full rounded-2xl bg-slate-100 hover:bg-primary hover:text-white text-slate-900 h-14 font-black transition-all group/btn">
                         CONFIGURE <Zap className="w-4 h-4 ml-2 group-hover/btn:fill-current" />
                      </Button>
                   </div>
                </div>
              </Link>
           ))}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-slate-300" />
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tight">NO MATCHING DATA</h3>
              <p className="text-slate-500 font-medium">Your search query did not return any inventory results.</p>
           </div>
           <Button onClick={() => window.history.back()} variant="outline" className="h-14 px-10 rounded-2xl font-bold">
              Return to Previous Node
           </Button>
        </div>
      )}
    </div>
  );
}
