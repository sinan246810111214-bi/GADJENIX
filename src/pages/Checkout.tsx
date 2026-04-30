import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, ShieldCheck, Truck, CreditCard, ChevronRight, Zap, CheckCircle2, QrCode, Upload, FileImage, X, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PAYMENT_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getGemini, GEMINI_MODEL } from "@/lib/gemini";
import { Type } from "@google/genai";

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCooldown = () => {
      const ts = localStorage.getItem('qr_cooldown_timestamp');
      if (ts) {
        const expiredAt = parseInt(ts) + (3 * 60 * 1000);
        if (Date.now() < expiredAt) {
          setQrCooldownUntil(expiredAt);
          const timer = setInterval(() => {
            const now = Date.now();
            if (now >= expiredAt) {
              setQrCooldownUntil(null);
              localStorage.removeItem('qr_cooldown_timestamp');
              clearInterval(timer);
            }
          }, 1000);
          return () => clearInterval(timer);
        } else {
          localStorage.removeItem('qr_cooldown_timestamp');
        }
      }
    };
    checkCooldown();
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIVerifying, setIsAIVerifying] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [qrCooldownUntil, setQrCooldownUntil] = useState<number | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    houseInfo: '',
    address: '',
    landmark: '',
    pincode: '',
    phone: '',
    paymentMethod: 'upi',
    transactionId: ''
  });

  if (items.length === 0 && !isOrdered) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 px-8 text-center">
         <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-slate-300" />
         </div>
         <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tight">Cart Registry Empty</h2>
            <p className="text-slate-500 font-medium max-sm">No hardware modules detected in your current session stack.</p>
         </div>
         <Button size="lg" onClick={() => navigate('/products')} className="h-16 px-12 rounded-2xl bg-primary text-white font-black">
            BROWSE INVENTORY
         </Button>
      </div>
    );
  }

  const baseTotal = getTotalPrice();
  const codFee = formData.paymentMethod === 'cod' ? PAYMENT_CONFIG.COD_FEE : 0;
  const grandTotal = baseTotal + codFee;

  const upiUri = `upi://pay?pa=${PAYMENT_CONFIG.UPI_ID}&pn=${encodeURIComponent(PAYMENT_CONFIG.MERCHANT_NAME)}&am=${grandTotal}&cu=${PAYMENT_CONFIG.CURRENCY}`;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file?.name, file?.type, file?.size);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large. Max size is 5MB");
        return;
      }
      setScreenshotFile(file);
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
      console.log("Screenshot preview generated:", url);
    }
  };

  const verifyPaymentWithAI = async (total: number): Promise<boolean> => {
    if (!screenshotFile) return false;
    
    setIsAIVerifying(true);
    const toastId = toast.loading("AI Verifying Payment Snapshot...");

    try {
      const ai = getGemini();
      const base64Data = await fileToBase64(screenshotFile);
      const now = new Date();
      const currentDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const currentDay = now.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
      
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: screenshotFile.type
              }
            },
            {
              text: `Analyze this payment screenshot for a real-time transaction. 
              
              CONTEXT:
              - Current Date & Time (IST): ${currentDateTime}
              - Current Day: ${currentDay}
              - Expected Amount: ₹${total}
              - Recipient UPI ID: "lithuahmd432@okaxis"
              
              STRICT VERIFICATION PROTOCOL:
              1. Status: Must be "Successful", "Completed", or "Done".
              2. Amount: Must match ₹${total} exactly.
              3. Recipient: Must be "lithuahmd432@okaxis".
              4. Temporal Integrity: The transaction date and time on the screenshot MUST be within the last 10 minutes of the current time (${currentDateTime}). Old screenshots from previous days or hours must be REJECTED.
              
              Return a JSON object with 'verified' (boolean) and 'reason' (short string in English explaining success or specific failure reason).`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verified: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["verified", "reason"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.verified) {
        toast.success("AI Verification Protocol: SECURED", { id: toastId });
        return true;
      } else {
        toast.error(`Verification Failed: ${result.reason || "Invalid Payment Screen"}`, { id: toastId });
        return false;
      }
    } catch (err: any) {
      if (err.message === "GEMINI_API_KEY_MISSING") {
        toast.error("AI node offline: Gemini API Key missing in System Settings", { id: toastId });
        return false;
      }
      console.error("AI Error:", err);
      toast.error("AI Node Failure: Could not analyze screenshot", { id: toastId });
      return false;
    } finally {
      setIsAIVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.paymentMethod === 'upi') {
      if (!screenshotFile) {
        toast.error("Security Protocol: Payment Screenshot Required");
        return;
      }
      
      const isVerified = await verifyPaymentWithAI(grandTotal);
      if (!isVerified) return;
    }

    setIsProcessing(true);
    console.log("Initiating Order Submission Sequence...");
    
    try {
      const orderData = {
        customer: {
          ...formData,
          email: formData.email || 'not-provided'
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.imageUrl || ''
        })),
        total: grandTotal,
        subtotal: baseTotal,
        codFee: codFee,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId || (formData.paymentMethod === 'upi' ? 'AI-VERIFIED' : 'COD'),
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      console.log("Order Secured in Firestore with ID:", docRef.id);
      
      // Dispatch Order Notification to Admin via Email Protocol
      try {
        const notifyResponse = await fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderData: { ...orderData, id: docRef.id } }),
        });
        if (notifyResponse.ok) {
          console.log("Admin Email Notification Dispatched Successfully");
        } else {
          console.error("Email Notification Protocol Failed Status:", notifyResponse.status);
        }
      } catch (notifyErr) {
        console.error("Notification Call Vector Failed:", notifyErr);
      }

      setIsOrdered(true);
      clearCart();
      localStorage.setItem('qr_cooldown_timestamp', Date.now().toString());
      toast.success("Transaction Sequence Successfully Completed");
      
    } catch (err: any) {
      console.error("Submission Process Aborted:", err);
      toast.error(`Process Aborted: Integration Failure`);
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isOrdered) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-[70vh] flex flex-col items-center justify-center space-y-8 px-8 text-center"
      >
         <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-white" />
         </div>
         <div className="space-y-4">
            <h2 className="text-5xl font-black uppercase tracking-tighter">ORDER SECURED</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
               Your hardware acquisition protocol has been initiated. 
               UTR: {formData.transactionId || (formData.paymentMethod === 'upi' ? 'AI-VERIFIED' : 'COD Protocol')}
            </p>
         </div>
         <Button size="lg" onClick={() => navigate('/')} className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black text-xl">
            RETURN TO COMMAND CENTER
         </Button>
      </motion.div>
    );
  }

  return (
    <div className="px-8 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-12">
           <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
                 Secure Bridge
              </Badge>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">CHECKOUT</h1>
           </div>

           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs">01</div>
                    Personal Identification
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Full Name</Label>
                       <Input 
                         required
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         placeholder="Authorized Operator Name" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Email Vector (Optional)</Label>
                       <Input 
                         type="email"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         placeholder="operator@network.com" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs">02</div>
                    Logistic Coordinates
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">House Name / Building No</Label>
                       <Input 
                         required
                         value={formData.houseInfo}
                         onChange={e => setFormData({...formData, houseInfo: e.target.value})}
                         placeholder="Terminal Node ID" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Area / Street Address</Label>
                       <Input 
                         required
                         value={formData.address}
                         onChange={e => setFormData({...formData, address: e.target.value})}
                         placeholder="Grid Sector Coordinates" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Landmark (Optional)</Label>
                       <Input 
                         value={formData.landmark}
                         onChange={e => setFormData({...formData, landmark: e.target.value})}
                         placeholder="Visual Nav Point" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Pincode</Label>
                       <Input 
                         required
                         pattern="[0-9]*"
                         value={formData.pincode}
                         onChange={e => setFormData({...formData, pincode: e.target.value})}
                         placeholder="Sector Code" 
                         className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Comm-Link Phone</Label>
                    <Input 
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 Matrix ID" 
                      className="h-14 rounded-xl bg-slate-50 border-none font-bold" 
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs">03</div>
                    Payment Protocol
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setFormData({...formData, paymentMethod: 'upi'})}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5 shadow-lg' : 'border-slate-100'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <QrCode className={`w-6 h-6 ${formData.paymentMethod === 'upi' ? 'text-primary' : 'text-slate-400'}`} />
                          <div className="flex flex-col">
                             <span className="font-black text-sm uppercase leading-tight">GADJENIX ACCOUNT</span>
                             <span className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest">(lithuahmd43)</span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div 
                      onClick={() => setFormData({...formData, paymentMethod: 'cod'})}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-lg' : 'border-slate-100'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <Truck className={`w-6 h-6 ${formData.paymentMethod === 'cod' ? 'text-primary' : 'text-slate-400'}`} />
                          <div className="flex flex-col">
                             <span className="font-black text-sm uppercase leading-tight">Pay on Delivery</span>
                             <span className="text-[10px] text-primary font-bold mt-1 tracking-widest">+₹{PAYMENT_CONFIG.COD_FEE} COD FEE</span>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                 </div>
              </div>

              <AnimatePresence>
                 {formData.paymentMethod === 'upi' && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center text-center space-y-6 mb-8"
                   >
                      <div className="space-y-2">
                         <h4 className="font-black uppercase italic tracking-tighter text-2xl italic underline decoration-primary/50 underline-offset-4">Scan to Pay Securely</h4>
                         <p className="text-xs text-slate-400 font-medium font-bold">Use any UPI app (GPay, PhonePe, Paytm) to complete transition.</p>
                      </div>
                      
                      <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl relative group">
                         {qrCooldownUntil ? (
                           <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-4 text-slate-900 border-4 border-primary/20">
                              <ShieldCheck className="w-8 h-8 text-primary mb-2 animate-pulse" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-center">Secure Cooldown</p>
                              <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase text-center mb-3">Wait {Math.ceil((qrCooldownUntil - Date.now()) / 1000)}s for next QR</p>
                              
                              <a 
                                href="https://wa.me/918590181381" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                              >
                                <span className="text-[9px] font-black uppercase tracking-tighter">Contact WhatsApp</span>
                              </a>
                           </div>
                         ) : (
                           <>
                             <QRCodeSVG value={upiUri} size={200} level="H" />
                             <div className="absolute inset-0 border-2 border-primary/20 rounded-3xl pointer-events-none group-hover:border-primary/50 transition-colors" />
                           </>
                         )}
                      </div>

                      <div className="flex flex-col gap-2">
                         <p className="text-4xl font-black text-primary tracking-tighter italic">₹{grandTotal}</p>
                         <div className="flex flex-col items-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protocol ID: {PAYMENT_CONFIG.UPI_ID}</p>
                            <p className="text-[9px] text-primary/60 font-black tracking-widest">(lithuahmd43)</p>
                         </div>
                      </div>

                      <div className="flex gap-4 items-center justify-center pt-2 grayscale opacity-40">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4 invert" alt="UPI" />
                         <div className="h-4 w-px bg-white/10" />
                         <img src="https://www.vectorlogo.zone/logos/google_pay/google_pay-icon.svg" className="h-5" alt="GPay" />
                         <img src="https://www.vectorlogo.zone/logos/phonepe/phonepe-icon.svg" className="h-5" alt="PhonePe" />
                      </div>

                      <div className="w-full pt-4 border-t border-white/10 space-y-6">
                        <div className="space-y-4">
                           <Label className="font-black text-[11px] uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> 
                              AI Verification: Upload Screenshot
                           </Label>
                           
                           <div className="relative group">
                              {!screenshotPreview ? (
                                 <label 
                                   htmlFor="screenshot-upload"
                                   className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all group-active:scale-[0.98]"
                                 >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 space-y-3">
                                       <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                          <Upload className="w-6 h-6" />
                                       </div>
                                       <div className="text-center">
                                          <p className="text-sm font-black uppercase tracking-tight">Select Payment Record</p>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">JPG, PNG up to 5MB</p>
                                       </div>
                                    </div>
                                    <input 
                                      id="screenshot-upload"
                                      type="file" 
                                      className="sr-only" 
                                      accept="image/*" 
                                      onChange={handleFileChange} 
                                    />
                                 </label>
                              ) : (
                                 <div className="relative rounded-2xl overflow-hidden border-2 border-primary shadow-2xl shadow-primary/20">
                                    <img src={screenshotPreview} className="w-full h-48 object-cover" alt="Verification Target" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                       <Button 
                                         type="button"
                                         variant="destructive" 
                                         size="icon" 
                                         className="rounded-full w-12 h-12"
                                         onClick={() => {
                                           setScreenshotFile(null);
                                           setScreenshotPreview(null);
                                         }}
                                       >
                                          <X className="w-6 h-6" />
                                       </Button>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-primary text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                       <FileImage className="w-3 h-3" /> Ready
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-2 text-left">
                           <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
                              <Zap className="w-3 h-3" /> Protocol Invariant
                           </p>
                           <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                              Our Gemini AI verifies screenshot successful status, exact amount (₹{grandTotal}), recipient ID, and the transaction time/date to ensure real-time validity.
                           </p>
                        </div>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>

              <Button 
                type="submit"
                disabled={isProcessing || isAIVerifying}
                className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                {(isProcessing || isAIVerifying) ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin" />
                    {isAIVerifying ? 'AI VERIFYING...' : 'SYNCHRONIZING...'}
                  </>
                ) : `COMMIT TRANSACTION • ₹${grandTotal}`}
              </Button>
           </form>
        </div>

        <div className="lg:col-span-5">
           <div className="sticky top-32 space-y-10">
              <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-3xl">
                 <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b border-white/10 pb-6 flex items-center justify-between">
                    Summary Stack <ShoppingCart className="w-6 h-6 text-primary" />
                 </h2>
                 <div className="space-y-6 max-h-[300px] overflow-y-auto no-scrollbar mb-8">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 group">
                         <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                            {(item.imageUrl || item.image) ? (
                              <img src={item.imageUrl || item.image} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <ShoppingCart className="w-6 h-6 text-slate-700" />
                            )}
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-1">QTY: {item.quantity}</p>
                         </div>
                         <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                 </div>
                 <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex justify-between text-sm text-gray-400 font-bold uppercase">
                       <span>Subtotal</span>
                       <span>₹{baseTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400 font-bold uppercase">
                       <span>Logistics Fee</span>
                       <span className="text-green-400">FREE</span>
                    </div>
                    {formData.paymentMethod === 'cod' && (
                      <div className="flex justify-between text-sm text-gray-400 font-bold uppercase">
                         <span>COD Charge</span>
                         <span className="text-primary">₹{PAYMENT_CONFIG.COD_FEE}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-2xl font-black uppercase tracking-tighter pt-4">
                       <span>Total</span>
                       <span className="text-primary font-mono">₹{grandTotal}</span>
                    </div>
                 </div>
              </div>

              <div className="p-8 border border-slate-100 rounded-[2.5rem] space-y-6">
                 <div className="flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <div>
                       <h4 className="font-black text-xs uppercase tracking-tight">Verified Protocol</h4>
                       <p className="text-[10px] text-slate-500 font-bold mt-0.5">TLS 1.3 / End-to-End Encryption</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <div>
                       <h4 className="font-black text-xs uppercase tracking-tight">Priority Node</h4>
                       <p className="text-[10px] text-slate-500 font-bold mt-0.5">Automated Warehouse Routing</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
