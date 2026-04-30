import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../lib/store';
import { toast } from 'sonner';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addItem, setIsOpen: setDrawerOpen } = useCart();

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => setDrawerOpen(true)
      }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden relative flex flex-col md:flex-row"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center">
              <img 
                src={product.image} 
                alt={product.name} 
                className="max-w-full max-h-[400px] object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full md:w-1/2 p-8 space-y-6">
              <div>
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-[#FFA41C] text-[#FFA41C]' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-sm text-[#007185] ml-2">4.2 (128 reviews)</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#B12704]">${product.price}</span>
                  <span className="text-sm text-gray-500 line-through">${(product.price * 1.2).toFixed(2)}</span>
                </div>
                <p className="text-sm text-[#007600] font-bold">In Stock</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Experience the next generation of technology with the {product.name}. 
                  Designed for performance and comfort, it's the perfect addition to your tech collection.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  1-Year Gadgenix Warranty Included
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleAddToCart}
                  className="amazon-button flex-1 h-12"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
