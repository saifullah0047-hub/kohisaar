const now = Date.now();
const date = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();

const category = { id: "cat-shilajit", name: "Shilajit Resin", slug: "shilajit-resin" };

export const adminDemoProducts = [
  {
    id: "demo-product-premium",
    slug: "kohi-saar-premium-shilajit-resin",
    name: "Kohisaar Pure Himalayan Shilajit Resin - Premium",
    shortDescription: "Premium Himalayan shilajit resin.",
    description: "A carefully sourced resin for a simple daily wellness ritual.",
    availability: "AVAILABLE",
    featured: true,
    category,
    variants: [{ id: "demo-variant-premium", name: "Premium", sku: "DEMO-PREMIUM", price: 2000, compareAtPrice: 2400, currency: "PKR", stockQuantity: 42, reservedQuantity: 3, lowStockThreshold: 10, availableQuantity: 39 }],
    images: [{ id: "demo-image-premium", src: "/images/premium.jpeg", alt: "Kohisaar Premium Shilajit Resin", sortOrder: 0 }],
    createdAt: date(18),
    updatedAt: date(2),
  },
  {
    id: "demo-product-100g",
    slug: "shilajit-resin-100g",
    name: "Pure Himalayan Shilajit Resin 100g",
    shortDescription: "Pure Himalayan shilajit resin in a 100g jar.",
    description: "A generous jar of pure Himalayan shilajit resin.",
    availability: "AVAILABLE",
    featured: true,
    category,
    variants: [{ id: "demo-variant-100g", name: "100g", sku: "DEMO-100G", price: 8000, compareAtPrice: 9000, currency: "PKR", stockQuantity: 8, reservedQuantity: 2, lowStockThreshold: 10, availableQuantity: 6 }],
    images: [{ id: "demo-image-100g", src: "/images/100 gram.jpeg", alt: "Kohisaar Shilajit Resin 100g", sortOrder: 0 }],
    createdAt: date(15),
    updatedAt: date(4),
  },
  {
    id: "demo-product-30g",
    slug: "shilajit-resin-30g",
    name: "Pure Himalayan Shilajit Resin 30g",
    shortDescription: "A compact jar for everyday use.",
    description: "Pure Himalayan shilajit resin in a convenient 30g format.",
    availability: "AVAILABLE",
    featured: true,
    category,
    variants: [{ id: "demo-variant-30g", name: "30g", sku: "DEMO-30G", price: 3200, compareAtPrice: 4000, currency: "PKR", stockQuantity: 0, reservedQuantity: 0, lowStockThreshold: 5, availableQuantity: 0 }],
    images: [{ id: "demo-image-30g", src: "/images/30 gram.jpeg", alt: "Kohisaar Shilajit Resin 30g", sortOrder: 0 }],
    createdAt: date(11),
    updatedAt: date(1),
  },
  {
    id: "demo-product-gold",
    slug: "gold-grade-resin-30g",
    name: "Pure Himalayan Gold Grade Shilajit Resin 30g",
    shortDescription: "Premium gold grade shilajit resin.",
    description: "A premium gold grade selection for the discerning customer.",
    availability: "PREORDER",
    featured: false,
    category,
    variants: [{ id: "demo-variant-gold", name: "30g", sku: "DEMO-GOLD-30G", price: 12000, compareAtPrice: null, currency: "PKR", stockQuantity: 5, reservedQuantity: 1, lowStockThreshold: 5, availableQuantity: 4 }],
    images: [{ id: "demo-image-gold", src: "/images/Gold grade.jpeg", alt: "Kohisaar Gold Grade Shilajit Resin", sortOrder: 0 }],
    createdAt: date(7),
    updatedAt: date(3),
  },
];

export const adminDemoOrders = [
  { orderNumber: "KS-DEMO-1042", email: "ayesha.khan@example.com", status: "DELIVERED", total: 8000, currency: "PKR", payment: { method: "ONLINE", status: "CAPTURED" }, createdAt: date(1) },
  { orderNumber: "KS-DEMO-1041", email: "hamza.ali@example.com", status: "PROCESSING", total: 5200, currency: "PKR", payment: { method: "CASH_ON_DELIVERY", status: "PENDING" }, createdAt: date(2) },
  { orderNumber: "KS-DEMO-1040", email: "sara.malik@example.com", status: "CONFIRMED", total: 12000, currency: "PKR", payment: { method: "ONLINE", status: "AUTHORIZED" }, createdAt: date(4) },
  { orderNumber: "KS-DEMO-1039", email: "bilal.ahmed@example.com", status: "SHIPPED", total: 3200, currency: "PKR", payment: { method: "CASH_ON_DELIVERY", status: "PENDING" }, createdAt: date(6) },
];

export const adminDemoResponse = (endpoint: string): { data: unknown } | undefined => {
  if (endpoint === "/admin/dashboard") {
    return { data: { counts: { products: 4, categories: 1, orders: 4, customers: 4, reviews: 3 }, revenueTotal: 28400, recentOrders: adminDemoOrders } };
  }
  if (endpoint === "/admin/products") return { data: adminDemoProducts };
  if (endpoint === "/categories") return { data: [category] };
  if (endpoint === "/admin/orders") return { data: adminDemoOrders };
  if (endpoint === "/admin/customers") return { data: [
    { id: "demo-customer-1", fullName: "Ayesha Khan", email: "ayesha.khan@example.com", phone: "+92 300 1234567", createdAt: date(28), orderCount: 3 },
    { id: "demo-customer-2", fullName: "Hamza Ali", email: "hamza.ali@example.com", phone: "+92 301 7654321", createdAt: date(20), orderCount: 2 },
    { id: "demo-customer-3", fullName: "Sara Malik", email: "sara.malik@example.com", phone: "+92 302 2223344", createdAt: date(13), orderCount: 1 },
    { id: "demo-customer-4", fullName: "Bilal Ahmed", email: "bilal.ahmed@example.com", phone: null, createdAt: date(6), orderCount: 1 },
  ] };
  if (endpoint === "/admin/reviews") return { data: [
    { id: "demo-review-1", rating: 5, title: "Excellent quality", body: "The packaging and product quality were excellent.", status: "APPROVED", createdAt: date(2), user: { id: "demo-customer-1", fullName: "Ayesha Khan", email: "ayesha.khan@example.com" }, product: { id: adminDemoProducts[0].id, name: adminDemoProducts[0].name, slug: adminDemoProducts[0].slug } },
    { id: "demo-review-2", rating: 4, title: "Good first order", body: "Fast delivery and clear instructions.", status: "PENDING", createdAt: date(3), user: { id: "demo-customer-2", fullName: "Hamza Ali", email: "hamza.ali@example.com" }, product: { id: adminDemoProducts[1].id, name: adminDemoProducts[1].name, slug: adminDemoProducts[1].slug } },
    { id: "demo-review-3", rating: 5, title: "Will order again", body: "A smooth buying experience.", status: "APPROVED", createdAt: date(8), user: { id: "demo-customer-3", fullName: "Sara Malik", email: "sara.malik@example.com" }, product: { id: adminDemoProducts[2].id, name: adminDemoProducts[2].name, slug: adminDemoProducts[2].slug } },
  ] };
  if (endpoint === "/admin/content/articles") return { data: [{ id: "demo-article-1", slug: "how-to-use-shilajit", title: "How to Use Himalayan Shilajit", excerpt: "A practical guide for a simple daily routine.", body: "Follow the serving instructions on the product label and consult a professional if needed.", status: "PUBLISHED", publishedAt: date(5), createdAt: date(12), updatedAt: date(5) }] };
  if (endpoint === "/admin/content/faqs") return { data: [
    { id: "demo-faq-1", question: "How should I store shilajit?", answer: "Keep it sealed in a cool, dry place away from direct sunlight.", sortOrder: 0, isActive: true, createdAt: date(15), updatedAt: date(3) },
    { id: "demo-faq-2", question: "How long does delivery take?", answer: "Orders usually arrive within 2 to 5 working days in Pakistan.", sortOrder: 1, isActive: true, createdAt: date(15), updatedAt: date(3) },
  ] };
  if (endpoint === "/admin/content/homepage") return { data: [
    { id: "demo-home-1", key: "hero", eyebrow: "PURE. TRACEABLE. HIMALAYAN.", title: "A grounded daily ritual.", body: "Discover carefully selected shilajit resin with clear product information.", imageSrc: "/images/premium.jpeg", imageAlt: "Premium shilajit resin", ctaLabel: "Shop the collection", ctaHref: "/shop", sortOrder: 0, isPublished: true, createdAt: date(20), updatedAt: date(2) },
    { id: "demo-home-2", key: "promise", eyebrow: "THE KOHISAAR PROMISE", title: "Simple, honest wellness.", body: "Clear sourcing and a straightforward shopping experience.", imageSrc: null, imageAlt: null, ctaLabel: "Learn more", ctaHref: "/about", sortOrder: 1, isPublished: true, createdAt: date(20), updatedAt: date(2) },
  ] };
  if (endpoint === "/admin/content/settings") return { data: [
    { id: "demo-setting-1", key: "store.contact", value: { email: "hello@kohisaar.com", phone: "+92 300 0000000" }, createdAt: date(20), updatedAt: date(2) },
    { id: "demo-setting-2", key: "store.shipping", value: { freeShippingThreshold: 5000, estimatedDays: "2-5 working days" }, createdAt: date(20), updatedAt: date(2) },
  ] };
  if (endpoint === "/admin/audit-logs") return { data: [
    { id: "demo-log-1", action: "UPDATE_PRODUCT", entity: "Product", entityId: adminDemoProducts[0].id, createdAt: date(1), user: { id: "demo-admin", email: "admin@kohisaar.com" } },
    { id: "demo-log-2", action: "CREATE_ORDER", entity: "Order", entityId: "KS-DEMO-1042", createdAt: date(2), user: null },
    { id: "demo-log-3", action: "PUBLISH_ARTICLE", entity: "Article", entityId: "demo-article-1", createdAt: date(5), user: { id: "demo-admin", email: "admin@kohisaar.com" } },
  ] };
  return undefined;
};
