import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ShieldAlert, KeyRound, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === adminPass) {
      localStorage.setItem('isAdmin', 'true');
      toast.success("Identity Verified. Access Granted.");
      navigate('/admin/dashboard');
    } else {
      toast.error("Access Denied: Invalid Security Token");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'dm8115589@gmail.com,klgadjenix@gmail.com').split(',');
      if (adminEmails.includes(result.user.email || '')) {
        toast.success("Admin Protocol Authorized");
        navigate('/admin/dashboard');
      } else {
        toast.error("Unauthorized Account Connection Detected");
      }
    } catch (err) {
      toast.error("Handshake Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-8">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Zap className="w-10 h-10 text-primary" />
           </div>
           <h1 className="text-4xl font-black tracking-tighter uppercase">Admin Protocol</h1>
           <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Restricted Maintenance Node</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-3xl space-y-8">
             <div className="space-y-4">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Security Key Entry</Label>
                <div className="relative">
                   <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                   <Input 
                     type="password" 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold" 
                     placeholder="••••••••"
                   />
                </div>
             </div>

             <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all">
                Initiate Access
             </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black text-slate-300">
              <span className="bg-[#F8FAFC] px-4">OR SECURE HANDSHAKE</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-16 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] flex gap-3"
          >
             <Globe className="w-4 h-4 text-primary" /> Login with Verified Google ID
          </Button>

          <div className="flex items-center gap-3 justify-center text-red-500 pt-2 animate-pulse">
             <ShieldAlert className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.1em]">Unauthorized Access Observed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
