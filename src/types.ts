export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface TechSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  brand?: string;
  vendor: string;
  category: string;
  image: string;
  imageUrl?: string;
  images: string[];
  tag?: string;
  description: string;
  technicalSpecs: TechSpec[];
  stockStatus: 'In Stock' | 'Out of Stock' | 'Limited Stock';
  rating: number;
  reviewCount: number;
  reviews: Review[];
  videoUrl?: string;
  specs: {
    battery?: string;
    bluetooth?: string;
    driverSize?: string;
    waterproof?: string;
    weight?: string;
    chipset?: string;
  };
}

export interface CartItem extends Product {
  quantity: number;
}
