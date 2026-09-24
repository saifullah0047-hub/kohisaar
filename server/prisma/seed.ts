import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const slug = "pure-himalayan-shilajit-benefits-uses-authenticity-guide";
const category = { name: "Shilajit Resin", slug: "shilajit-resin" };
const catalog = [
  { slug: "kohi-saar-premium-shilajit-resin", name: "Kohisaar Pure Himalayan Shilajit Resin - Premium Shilajit", shortDescription: "Premium shilajit resin.", description: "Kohi Saar Pure Himalayan Shilajit Resin.", featured: true, variant: { id: "kohi-saar-premium-default", name: "Premium", price: 2000, compareAtPrice: 2400 }, images: [{ src: "/images/premium.jpeg", alt: "Kohi Saar Premium Shilajit Resin" }] },
  { slug: "shilajit-resin-100g", name: "Pure Himalayan Shilajit Resin 100g", shortDescription: "Pure Himalayan shilajit resin.", description: "Pure Himalayan Shilajit Resin, 100g.", featured: true, variant: { id: "shilajit-resin-100g-default", name: "100g", price: 8000, compareAtPrice: 9000 }, images: [{ src: "/images/100 gram.jpeg", alt: "Kohi Saar Shilajit Resin 100g" }] },
  { slug: "shilajit-resin-50g", name: "Pure Himalayan Shilajit Resin 50g", shortDescription: "Pure Himalayan shilajit resin.", description: "Pure Himalayan Shilajit Resin, 50g.", featured: true, variant: { id: "shilajit-resin-50g-default", name: "50g", price: 4000, compareAtPrice: 5000 }, images: [{ src: "/images/50 gram.jpeg", alt: "Kohi Saar Shilajit Resin 50g" }] },
  { slug: "shilajit-resin-30g", name: "Pure Himalayan Shilajit Resin 30g", shortDescription: "Pure Himalayan shilajit resin.", description: "Pure Himalayan Shilajit Resin, 30g.", featured: true, variant: { id: "shilajit-resin-30g-default", name: "30g", price: 3200, compareAtPrice: 4000 }, images: [{ src: "/images/30 gram.jpeg", alt: "Kohi Saar Shilajit Resin 30g" }] },
  { slug: "shilajit-resin-15g", name: "Pure Himalayan Shilajit Resin 15g", shortDescription: "Pure Himalayan shilajit resin.", description: "Pure Himalayan Shilajit Resin, 15g.", featured: true, variant: { id: "shilajit-resin-15g-default", name: "15g", price: 2000, compareAtPrice: 2800 }, images: [{ src: "/images/15 gram.jpeg", alt: "Kohi Saar Shilajit Resin 15g" }] },
  { slug: "shilajit-resin-8g", name: "Pure Himalayan Shilajit Resin 8g", shortDescription: "Pure Himalayan shilajit resin.", description: "Pure Himalayan Shilajit Resin, 8g.", featured: true, variant: { id: "shilajit-resin-8g-default", name: "8g", price: 1200, compareAtPrice: 1600 }, images: [{ src: "/images/8 gram.jpeg", alt: "Kohi Saar Shilajit Resin 8g" }] },
  { slug: "gold-grade-resin-30g", name: "Pure Himalayan Gold Grade Shilajit Resin 30g", shortDescription: "Premium gold grade shilajit resin.", description: "Pure Himalayan Gold Grade Shilajit Resin, 30g.", featured: true, variant: { id: "gold-grade-resin-30g-default", name: "30g", price: 12000, compareAtPrice: null }, images: [{ src: "/images/Gold grade.jpeg", alt: "Kohi Saar Gold Grade Shilajit Resin 30g" }] },
];
const body = `## What Is Himalayan Shilajit?

Shilajit is a naturally occurring substance found in mountainous regions, including areas associated with the Himalayan and surrounding mountain ranges.

It develops over long periods through natural geological and biological processes and contains various mineral and organic compounds.

Traditionally, Shilajit has been valued as part of wellness practices in South Asia and Ayurveda.

## Traditional Benefits of Shilajit

Shilajit has a long history of traditional use for general vitality and wellness.

People commonly use Shilajit as part of their daily routine because they are interested in:

- General energy and vitality
- Traditional wellness support
- Maintaining an active lifestyle
- Overall health and well-being

It is important to remember that traditional use and modern health claims are not the same thing. Shilajit should not be considered a treatment or cure for a medical condition.

## Why Choose Pure Himalayan Shilajit?

The quality and sourcing of Shilajit matter when selecting a product.

A quality Shilajit product should have:

- **Clear product information:** Customers should be able to understand what they are purchasing.
- **Responsible sourcing:** Information about the product's origin helps customers make an informed decision.
- **Appropriate processing and storage:** Shilajit should be handled and stored according to the manufacturer's instructions.
- **Quality testing where available:** Independent testing or laboratory information can provide additional confidence about product quality and composition.

## How to Identify Authentic Shilajit

When searching for authentic Shilajit in Pakistan, don't rely only on appearance or marketing claims.

Before purchasing, consider:

- Check the product information
- Look for clear sourcing details
- Check packaging and labeling
- Look for laboratory or quality information when available
- Purchase from a reputable seller

A professional brand should make important product information easy for customers to understand.

## How to Use Shilajit

The correct serving depends on the specific product and its formulation.

Always follow the manufacturer's recommended serving instructions and do not exceed the recommended amount.

If you are new to Shilajit, following the product instructions is the best starting point rather than assuming that more is better.

People commonly incorporate Shilajit into their daily wellness routine according to the product's directions.

## Who Should Be Careful With Shilajit?

Shilajit is a wellness product and isn't suitable for everyone.

If you are pregnant or breastfeeding, have an existing medical condition, take prescription medicines, or have concerns about using Shilajit, speak with a qualified healthcare professional before use.

Choose products that provide clear instructions and responsible usage information.

## Why Kohisaar Shilajit?

At Kohisaar Shilajit, our focus is on providing customers with a straightforward shopping experience and clear information about our products.

We believe customers should be able to understand what they are buying, how to use it, and what to consider when choosing a Shilajit product.

Our goal is to make discovering Himalayan Shilajit simple, transparent and convenient for customers in Pakistan.

## Final Thoughts

Himalayan Shilajit has a long history of traditional use and continues to attract interest from people looking for traditional wellness products.

When choosing pure Shilajit, focus on product information, sourcing, responsible processing, labeling and quality information rather than relying on exaggerated claims.

Whether you are learning about Shilajit benefits, researching authentic Shilajit, or simply exploring traditional wellness products, understanding what you are purchasing is an important first step.

Explore Kohisaar Shilajit and discover our range of Himalayan Shilajit products.`;

async function main() {
  const seededCategory = await prisma.category.upsert({
    where: { slug: category.slug },
    create: category,
    update: {},
  });

  for (const item of catalog) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, name: item.name, shortDescription: item.shortDescription, description: item.description, categoryId: seededCategory.id, availability: "AVAILABLE", featured: item.featured },
      update: {},
    });

    await prisma.productVariant.upsert({
      where: { sku: item.variant.id },
      create: { productId: product.id, name: item.variant.name, sku: item.variant.id, price: item.variant.price, compareAtPrice: item.variant.compareAtPrice, currency: "PKR" },
      update: {},
    });

    for (const [sortOrder, image] of item.images.entries()) {
      await prisma.productImage.upsert({
        where: { productId_sortOrder: { productId: product.id, sortOrder } },
        create: { productId: product.id, src: image.src, alt: image.alt, sortOrder },
        update: {},
      });
    }
  }

  await prisma.article.upsert({
    where: { slug },
    create: { slug, title: "Pure Himalayan Shilajit: Benefits, Uses & Authenticity Guide", excerpt: "Learn what Himalayan Shilajit is, how it has traditionally been used, and what to consider when choosing an authentic product.", body, status: "PUBLISHED", publishedAt: new Date("2026-09-11T00:00:00.000Z") },
    update: { title: "Pure Himalayan Shilajit: Benefits, Uses & Authenticity Guide", excerpt: "Learn what Himalayan Shilajit is, how it has traditionally been used, and what to consider when choosing an authentic product.", body, status: "PUBLISHED", publishedAt: new Date("2026-09-11T00:00:00.000Z") },
  });

  await prisma.$disconnect();
}

void main();
