import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Zap } from 'lucide-react';
import { useCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-md"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                   <Zap className="w-5 h-5 text-primary fill-current" />
                </div>
                <div>
                   <h2 className="text-xl font-black uppercase tracking-tighter">Your Stack</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getTotalItems()} Active Modules</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-xl h-10 w-10 border-slate-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Registry Empty</h3>
                    <p className="text-slate-500 font-medium text-sm">No hardware modules detected in your current session.</p>
                  </div>
                  <Button 
                    onClick={() => { setIsOpen(false); navigate('/products'); }}
                    className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-xl"
                  >
                    DEPLOY INVENTORY
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-6 group">
                    <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden flex items-center justify-center">
                      {((item as any).imageUrl || item.image) ? (
                        <img
                          src={(item as any).imageUrl || item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between gap-2">
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 line-clamp-2">{item.name}</h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xl font-black font-mono text-slate-900">₹{item.price}</p>
                      
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-3 px-3 py-1 border-2 border-yellow-400 rounded-full bg-white text-slate-900 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Subtotal Protocol</span>
                    <span className="text-slate-900">₹{getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Logistics Node</span>
                    <span className="text-green-500 font-black">ENCRYPTED FREE</span>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="flex justify-between text-2xl font-black uppercase tracking-tighter text-slate-900">
                    <span>Total Cost</span>
                    <span className="text-primary font-mono">₹{getTotalPrice()}</span>
                  </div>
                </div>
                <Button
                  onClick={() => { setIsOpen(false); navigate('/checkout'); }}
                  className="w-full h-18 rounded-2xl bg-primary text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  INITIALIZE CHECKOUT <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
                <div className="flex items-center gap-2 justify-center pb-2">
                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400">
                      SECURE TRANSACTION BRIDGE ACTIVE
                   </Badge>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
