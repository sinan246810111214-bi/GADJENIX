import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { notFound } from "next/navigation";
import { generateProductSchema } from "@/lib/seo";
import { Star, Shield, Truck, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * SEO: Generate dynamic metadata for the product page.
 */
export async function generateMetadata({ params }) {
  const { slug } = params;

  try {
    const q = query(
      collection(db, "products"),
      where("slug", "==", slug),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        title: "Product Not Found | Gadgenix",
        description: "The requested product does not exist our catalog."
      };
    }

    const product = querySnapshot.docs[0].data();

    return {
      title: `${product.name} | Gadgenix Premium Tech`,
      description: product.description || `Buy ${product.name} at Gadgenix. Premium quality, best performance.`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: [product.thumbnail || product.image],
        type: 'website',
      },
    };
  } catch (error) {
    console.error("Metadata Generation Error:", error);
    return { title: "Gadgenix | Premium Technology" };
  }
}

/**
 * Product Dynamic Page Component
 */
export default async function ProductPage({ params }) {
  const { slug } = params;

  // 1. Fetch data from Firestore
  let product = null;
  try {
    const q = query(
      collection(db, "products"),
      where("slug", "==", slug),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      product = querySnapshot.docs[0].data();
    }
  } catch (error) {
    console.error("Firestore Fetch Error:", error);
  }

  // Not found if slug doesn't match
  if (!product) {
    notFound();
  }

  // 2. Generate JSON-LD Schema
  const productSchema = generateProductSchema(product);

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-primary/20">
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Product Visual Stage */}
          <div className="space-y-8">
            <div className="aspect-square bg-white rounded-[3rem] overflow-hidden border border-border flex items-center justify-center p-16 relative shadow-sm">
               <div className="absolute top-10 left-10">
                  <Badge className="bg-primary text-white border-none px-5 py-2.5 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20">
                     {product.tag || product.category}
                  </Badge>
               </div>
               <img 
                 src={product.thumbnail || product.image} 
                 alt={product.name} 
                 className="w-full h-full object-contain hover:scale-110 transition-transform duration-1000 ease-out"
                 referrerPolicy="no-referrer"
               />
            </div>
            
            {/* Gallery Track */}
            <div className="grid grid-cols-4 gap-4">
               {product.images?.map((img, i) => (
                 <div key={i} className="aspect-square bg-white rounded-3xl border border-border p-5 hover:border-primary transition-all cursor-pointer shadow-sm">
                    <img src={img} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                 </div>
               ))}
            </div>
          </div>

          {/* Product Intelligence & Narrative */}
          <div className="space-y-16">
            <div className="space-y-6">
               <div className="flex items-center gap-5 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] font-mono">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Star className="w-3.5 h-3.5 fill-primary" /> {product.rating || '4.8'}
                  </span>
                  <span className="opacity-30">|</span>
                  <span>{product.reviewCount || '1.2K'} ANALYTICS REPORTS</span>
               </div>
               
               <h1 className="text-6xl lg:text-8xl font-black font-heading tracking-tight leading-[0.85] text-foreground">
                  {product.name}
               </h1>
               
               <div className="flex items-center gap-6 pt-6">
                  <div className="px-8 py-4 bg-primary rounded-2xl shadow-2xl shadow-primary/30">
                     <span className="text-4xl font-black font-mono text-white">${product.price}</span>
                  </div>
                  {product.originalPrice && (
                    <span className="text-2xl text-muted-foreground line-through font-medium opacity-50">${product.originalPrice}</span>
                  )}
               </div>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium">
               {product.description}
            </p>

            {/* Direct Interaction Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
               <Button className="h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                  INITIALIZE ACQUISITION
               </Button>
               <Button variant="outline" className="h-20 text-xl font-bold rounded-3xl border-2 border-border hover:bg-white hover:border-primary transition-all">
                  CORE STORAGE (CART)
               </Button>
            </div>

            {/* Technical Parameters Display */}
            <div className="pt-16 border-t border-border">
               <h3 className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground/60 mb-10">CORE SYSTEM ARCHITECTURE</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-12 gap-x-8">
                  {Object.entries(product.specs || {
                    "Connectivity": "Quantum Wireless",
                    "Latency": "< 0.1ms",
                    "Core": "G2 Silicon"
                  }).map(([key, val]) => (
                    <div key={key} className="space-y-2 group">
                       <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest group-hover:text-primary transition-colors">{key}</p>
                       <p className="font-bold text-lg tracking-tight text-foreground">{val}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Platform Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10">
               {[
                 { icon: Shield, label: '3-YEAR SYSTEM WARRANTY' },
                 { icon: Truck, label: 'NEXT-DAY LOGISTICS' },
                 { icon: RotateCcw, label: '30-DAY LOGIC RESET' }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col gap-4 p-8 bg-white rounded-3xl border border-border hover:border-primary/30 transition-all group">
                    <item.icon className="w-7 h-7 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-tight text-muted-foreground group-hover:text-foreground">{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
