export type ProductAvailability = "available" | "unavailable" | "preorder";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  variants: ProductVariant[];
  category: string;
  availability: ProductAvailability;
  featured: boolean;
  videoSrc?: string;
  ingredients?: string[];
  usage?: string;
  faq?: ProductFaq[];
  shippingInformation?: string;
}
