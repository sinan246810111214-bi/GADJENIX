import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { GitCompare, Check, X, ShieldCheck, Zap, Cpu, Watch, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Compare() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  return (
    <div className="px-8 py-12 space-y-20">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
          Comparison Engine
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-tight">
          MODULE BENCHMARK
        </h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">
          Cross-reference precision hardware specifications to optimize your acquisition protocol. Compare up to 3 units simultaneously.
        </p>
      </div>

      {/* Selection Area */}
      <section className="space-y-8">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
           Inventory Select <span className="text-slate-300 font-mono text-sm">[{selectedIds.length}/3]</span>
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
           {products.map(product => (
              <div 
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={`flex-shrink-0 w-48 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedIds.includes(product.id) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                 <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3">
                    <div className="w-full h-full flex items-center justify-center">
                       {(product.imageUrl || product.image) ? (
                         <img src={product.imageUrl || product.image} className="w-full h-full object-cover" alt={product.name} />
                       ) : (
                         <Cpu className="w-8 h-8 text-slate-200" />
                       )}
                    </div>
                 </div>
                 <h4 className="font-bold text-xs line-clamp-1 truncate uppercase">{product.name}</h4>
              </div>
           ))}
        </div>
      </section>

      {/* Table */}
      {selectedProducts.length > 0 ? (
        <section className="overflow-x-auto rounded-[3rem] border border-slate-100 shadow-2xl bg-white p-4">
           <table className="w-full border-collapse">
              <thead>
                 <tr>
                    <th className="p-10 text-left bg-slate-50 rounded-tl-[2rem] w-64">
                       <h4 className="text-2xl font-black uppercase tracking-tight">Core Specs</h4>
                       <p className="text-xs text-slate-500 font-bold mt-2">TECHNICAL PARITY</p>
                    </th>
                    {selectedProducts.map(p => (
                      <th key={p.id} className="p-10 text-center min-w-[300px]">
                         <div className="space-y-4">
                            <div className="w-32 h-32 mx-auto bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                               {(p.imageUrl || p.image) ? (
                                 <img src={p.imageUrl || p.image} className="w-full h-full object-contain" alt={p.name} />
                               ) : (
                                 <Cpu className="w-10 h-10 text-slate-200" />
                               )}
                            </div>
                            <div>
                               <h3 className="text-xl font-bold line-clamp-1">{p.name}</h3>
                               <p className="text-2xl font-black text-primary font-mono mt-2">₹{p.price}</p>
                            </div>
                         </div>
                      </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {[
                   { label: 'Category', key: 'category' },
                   { label: 'Battery Capacity', value: '400mAh / 48h Standby' },
                   { label: 'Transmission', value: 'Bluetooth 5.4 LE' },
                   { label: 'Latency Rate', value: 'Low-latency <45ms' },
                   { label: 'Hardware Driver', value: '40mm Titanium Shell' },
                   { label: 'Protection Rating', value: 'IPX5 Water Resistant' },
                 ].map((row, idx) => (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-8 text-sm font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">{row.label}</td>
                      {selectedProducts.map(p => (
                        <td key={p.id} className="p-8 text-center font-bold text-slate-700">
                           {row.key ? p[row.key] : row.value}
                        </td>
                      ))}
                   </tr>
                 ))}
                 <tr>
                    <td className="p-8 bg-slate-50/50"></td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-8 text-center">
                         <Button className="w-full h-14 rounded-xl font-black bg-slate-900 group">
                            Acquire Unit <Zap className="ml-2 w-4 h-4 group-hover:fill-current" />
                         </Button>
                      </td>
                    ))}
                 </tr>
              </tbody>
           </table>
        </section>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center animate-pulse">
              <GitCompare className="w-10 h-10 text-slate-300" />
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tight uppercase">No Compare State</h3>
              <p className="text-slate-500 font-medium">Select at least one hardware module to initiate benchmark analysis.</p>
           </div>
        </div>
      )}
    </div>
  );
}
