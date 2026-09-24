"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types/product";

function isValidSrc(src: string | undefined): boolean {
  if (!src) return false;
  try {
    if (src.startsWith("/")) return true;
    new URL(src);
    return true;
  } catch {
    return false;
  }
}

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const validImages = product.images.filter((img) => isValidSrc(img.src));
  const activeImage = validImages[activeIndex];

  if (validImages.length === 0) {
    return <div className="product-gallery product-gallery--empty" aria-label="No images available" />;
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery__active">
        {activeImage ? <Image src={activeImage.src} alt={activeImage.alt} width={1200} height={1500} priority className="product-gallery__image" /> : null}
      </div>
      {validImages.length > 1 ? (
        <div className="product-gallery__thumbs" aria-label="Product images">
          {validImages.map((image, index) => (
            <button
              className={`product-gallery__thumb${index === activeIndex ? " product-gallery__thumb--active" : ""}`}
              type="button"
              key={image.src}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <Image src={image.src} alt="" width={160} height={200} sizes="80px" className="product-gallery__thumb-image" />
            </button>
          ))}
        </div>
      ) : null}
      {product.videoSrc ? (
        <video className="product-gallery__video" controls muted playsInline preload="none">
          <source src={product.videoSrc} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
