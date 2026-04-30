import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import { Toaster } from 'sonner';
import '../src/index.css';

export async function generateMetadata() {
  const docRef = doc(db, 'settings', 'site_config');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      title: data.siteTitle || 'Gadgenix | Premium Tech Gadgets',
      description: data.metaDescription || 'High-performance headsets, smartwatches, and accessories.',
      icons: {
        icon: data.faviconUrl || '/favicon.ico',
      }
    };
  }

  return {
    title: 'Gadgenix | Premium Tech Gadgets',
    description: 'High-performance headsets, smartwatches, and accessories.',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-primary/30 font-sans">
        <Toaster richColors position="top-right" />
        <Header />
        {children}
      </body>
    </html>
  );
}
