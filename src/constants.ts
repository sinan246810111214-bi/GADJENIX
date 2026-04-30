import { Product } from './types';

export const PRODUCTS: Product[] = [
  { 
    id: 'p9', 
    name: 'P9 Max Headset', 
    price: 299.99, 
    originalPrice: 399.99,
    brand: 'Gadgenix',
    vendor: 'Gadgenix Official Store',
    category: 'Audio', 
    image: 'https://picsum.photos/seed/p9/800/800', 
    images: [
      'https://picsum.photos/seed/p9-1/800/800',
      'https://picsum.photos/seed/p9-2/800/800',
      'https://picsum.photos/seed/p9-3/800/800'
    ],
    tag: 'Best Seller',
    description: 'The P9 Max represents the pinnacle of personal audio. Featuring custom-designed drivers, active noise cancellation, and a minimalist aesthetic.',
    technicalSpecs: [
      { label: 'Battery Life', value: '40 Hours' },
      { label: 'Bluetooth', value: 'v5.3' },
      { label: 'Driver Size', value: '40mm Dynamic' },
      { label: 'Waterproof', value: 'IPX4' },
      { label: 'Weight', value: '385g' }
    ],
    stockStatus: 'In Stock',
    rating: 4.8,
    reviewCount: 1240,
    reviews: [
      { id: 'r1', user: 'Rahul K.', rating: 5, comment: 'Amazing sound quality! Best headset I have ever owned.', date: '2026-03-15' },
      { id: 'r2', user: 'Anjali S.', rating: 4, comment: 'Very comfortable for long hours, but a bit heavy.', date: '2026-03-10' }
    ],
    specs: {
      battery: '40 Hours',
      bluetooth: 'v5.3',
      driverSize: '40mm Dynamic',
      waterproof: 'IPX4',
      weight: '385g'
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  { 
    id: 'm19', 
    name: 'M19 Pro Buds', 
    price: 89.99, 
    originalPrice: 129.99,
    brand: 'Gadgenix',
    vendor: 'Gadgenix Official Store',
    category: 'Audio', 
    image: 'https://picsum.photos/seed/m19/800/800', 
    images: [
      'https://picsum.photos/seed/m19-1/800/800',
      'https://picsum.photos/seed/m19-2/800/800'
    ],
    tag: 'Limited Deal',
    description: 'Crystal clear audio with deep bass and instant pairing. The M19 Pro Buds are designed for the active lifestyle.',
    technicalSpecs: [
      { label: 'Battery Life', value: '6 Hours (24 with case)' },
      { label: 'Bluetooth', value: 'v5.2' },
      { label: 'Driver Size', value: '10mm' },
      { label: 'Waterproof', value: 'IPX7' },
      { label: 'Weight', value: '4.5g per bud' }
    ],
    stockStatus: 'Limited Stock',
    rating: 4.5,
    reviewCount: 850,
    reviews: [
      { id: 'r3', user: 'Sreejith M.', rating: 5, comment: 'Ithu adipoli aanu! Bass is really good.', date: '2026-03-20' }
    ],
    specs: {
      battery: '6 Hours (24 with case)',
      bluetooth: 'v5.2',
      driverSize: '10mm',
      waterproof: 'IPX7',
      weight: '4.5g per bud'
    }
  },
  { 
    id: 'w1', 
    name: 'G-Watch Series 5', 
    price: 199.99, 
    originalPrice: 249.99,
    brand: 'Gadgenix',
    vendor: 'Gadgenix Official Store',
    category: 'Wearables', 
    image: 'https://picsum.photos/seed/watch1/800/800', 
    images: [
      'https://picsum.photos/seed/watch1-1/800/800',
      'https://picsum.photos/seed/watch1-2/800/800'
    ],
    tag: 'Best Seller',
    description: 'Track your health with precision. The G-Watch Series 5 features an advanced heart rate monitor and blood oxygen sensor.',
    technicalSpecs: [
      { label: 'Battery Life', value: '48 Hours' },
      { label: 'Bluetooth', value: 'v5.0' },
      { label: 'Waterproof', value: '5ATM' },
      { label: 'Weight', value: '45g' },
      { label: 'Chipset', value: 'G1 Silicon' }
    ],
    stockStatus: 'In Stock',
    rating: 4.7,
    reviewCount: 2100,
    reviews: [
      { id: 'r4', user: 'Meera P.', rating: 5, comment: 'Very accurate tracking and looks premium.', date: '2026-03-25' }
    ],
    specs: {
      battery: '48 Hours',
      bluetooth: 'v5.0',
      waterproof: '5ATM',
      weight: '45g',
      chipset: 'G1 Silicon'
    }
  },
  { 
    id: 'p8', 
    name: 'P8 Lite Buds', 
    price: 49.99, 
    originalPrice: 79.99,
    brand: 'Gadgenix',
    vendor: 'Gadgenix Official Store',
    category: 'Audio', 
    image: 'https://picsum.photos/seed/p8/800/800', 
    images: [
      'https://picsum.photos/seed/p8-1/800/800'
    ],
    description: 'Affordable high-quality audio. Perfect for everyday use.',
    technicalSpecs: [
      { label: 'Battery Life', value: '4 Hours (16 with case)' },
      { label: 'Bluetooth', value: 'v5.1' },
      { label: 'Driver Size', value: '8mm' },
      { label: 'Waterproof', value: 'IPX4' }
    ],
    stockStatus: 'In Stock',
    rating: 4.2,
    reviewCount: 450,
    reviews: [
      { id: 'r5', user: 'Arun V.', rating: 4, comment: 'Good for the price. Battery could be better.', date: '2026-03-28' }
    ],
    specs: {
      battery: '4 Hours (16 with case)',
      bluetooth: 'v5.1',
      driverSize: '8mm',
      waterproof: 'IPX4'
    }
  }
];
