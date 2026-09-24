/* ================================================================== */
/*  Admin Resource Types                                               */
/*  Derived from Prisma schema and backend API response shapes         */
/* ================================================================== */

/* ── Enums ── */

export type ProductAvailability = "AVAILABLE" | "UNAVAILABLE" | "PREORDER";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "FULFILLED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentMethod = "CASH_ON_DELIVERY" | "ONLINE";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DiscountType = "FIXED" | "PERCENTAGE";

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/* ── Products ── */

export interface AdminProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
}

export interface AdminProductImage {
  id: string;
  src: string;
  alt: string;
  sortOrder: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  availability: ProductAvailability;
  featured: boolean;
  category: { id: string; name: string; slug: string };
  variants: AdminProductVariant[];
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductWritePayload {
  categoryId: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  availability?: ProductAvailability;
  featured?: boolean;
}

export interface VariantWritePayload {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  inventoryQuantity?: number;
}

export interface ImageWritePayload {
  src: string;
  alt: string;
  sortOrder?: number;
}

/* ── Orders ── */

export interface AdminOrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
}

export interface AdminOrder {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  total: number;
  currency: string;
  payment: AdminOrderPayment | null;
  createdAt: string;
}

export interface AdminOrderAddress {
  recipient: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  notes: string | null;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderPaymentRecord {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string | null;
  providerReference: string | null;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface AdminOrderDetail {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  address: AdminOrderAddress | null;
  items: AdminOrderItem[];
  payments: AdminOrderPaymentRecord[];
}

/* ── Customers ── */

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
}

/* ── Reviews ── */

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
  product: { id: string; name: string; slug: string };
}

/* ── Content: Articles ── */

export interface AdminArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleWritePayload {
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  status?: ArticleStatus;
  publishedAt?: string;
}

/* ── Content: FAQs ── */

export interface AdminFAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQWritePayload {
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}

/* ── Content: Homepage Sections ── */

export interface AdminHomepageSection {
  id: string;
  key: string;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSectionWritePayload {
  eyebrow?: string;
  title?: string;
  body?: string;
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

/* ── Content: Site Settings ── */

export interface AdminSiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/* ── Categories ── */

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

/* ── Coupons ── */

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── Inventory History ── */

export interface AdminInventoryHistory {
  id: string;
  variantId: string;
  stockDelta: number;
  reservedDelta: number;
  stockQuantityAfter: number;
  reservedQuantityAfter: number;
  reason: string;
  createdAt: string;
}

/* ── Audit Logs ── */

export interface AdminAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; email: string } | null;
}

/* ── Dashboard ── */

export interface DashboardSummary {
  counts: Record<string, number>;
  recentOrders: Array<{
    orderNumber: string;
    status: OrderStatus;
    total: number;
    currency: string;
    createdAt: string;
  }>;
}
