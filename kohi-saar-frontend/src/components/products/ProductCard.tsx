"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useDrawer } from "@/components/cart/DrawerProvider";
import { useToast } from "@/components/ui/ToastProvider";
import type { Product } from "@/types/product";
import { sanitizeImageSrc } from "@/lib/image-utils";

interface ProductCardProps {
  product: Product;
  catalogPosition?: number;
  catalogTotal?: number;
}

function formatPrice(price: number, currency: string) {
  return currency === "PKR"
    ? `Rs. ${price.toLocaleString("en-PK")}`
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

export function ProductCard({ product, catalogPosition, catalogTotal }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();
  const { openDrawer } = useDrawer();
  const { showToast } = useToast();
  const image = product.images[0];
  const hasImage = image && !imgError;
  const hasSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const isUnavailable = product.availability === "unavailable";
  const hasSingleVariant = product.variants.length === 1;

  const handleAddToCart = () => {
    if (!hasSingleVariant || isUnavailable) {
      router.push(`/products/${product.slug}`);
      return;
    }

    const result = addItem(product, 1, product.variants[0].id);
    if (!result.success) {
      showToast(result.message ?? "Unable to add to cart.", { variant: "error" });
      return;
    }

    openDrawer(product.name);
  };

  return (
    <div className={`product-card${product.featured ? " product-card--featured" : ""}`}>
      <div className="product-card__image-frame">
        <Link
          className="product-card__link"
          href={`/products/${product.slug}`}
          aria-label={`${product.name} — ${formatPrice(product.price, product.currency)}`}
        >
          {hasImage ? (
            <Image
              className="product-card__image"
              src={sanitizeImageSrc(image.src)}
              alt={image.alt}
              width={320}
              height={320}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : null}
          <span className="product-card__view-indicator" aria-hidden="true">VIEW</span>
        </Link>
        <button
          className="product-card__add"
          type="button"
          onClick={handleAddToCart}
          aria-label={hasSingleVariant ? `Add ${product.name} to cart` : `Choose a size for ${product.name}`}
        >
          Add to cart
        </button>
      </div>

      <div className="product-card__details">
        {catalogPosition != null && catalogTotal != null && (
          <p className="product-card__number">
            NO. {String(catalogPosition).padStart(2, "0")} / {String(catalogTotal).padStart(2, "0")}
          </p>
        )}
        <p className="product-card__eyebrow">{product.category}</p>
        <h3 className="product-card__name">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="product-card__price">
          <span className="product-card__price--current">{formatPrice(product.price, product.currency)}</span>
          {hasSale && (
            <>
              <span className="product-card__price-separator">|</span>
              <span className="product-card__price--original">{formatPrice(product.compareAtPrice!, product.currency)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
