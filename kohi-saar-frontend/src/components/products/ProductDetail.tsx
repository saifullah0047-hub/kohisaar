"use client";

import { useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useDrawer } from "@/components/cart/DrawerProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ReviewForm } from "@/components/products/ReviewForm";
import type { Product } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

function formatPrice(price: number, currency: string) {
  return currency === "PKR" ? `Rs. ${price.toLocaleString("en-PK")}` : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { openDrawer } = useDrawer();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const price = selectedVariant?.price ?? product.price;
  const currency = selectedVariant?.currency ?? product.currency;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const isAvailable = product.availability === "available" || product.availability === "preorder";

  const [cartMessage, setCartMessage] = useState<string>();
  const handleAddToCart = () => {
    if (adding) return;
    setAdding(true);
    setCartMessage(undefined);

    const result = addItem(product, quantity, selectedVariantId);

    if (!result.success) {
      setAdding(false);
      setCartMessage(result.message);
      showToast(result.message ?? "Unable to add to cart.", { variant: "error" });
      return;
    }

    setAdded(true);
    openDrawer(product.name);

    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => { setAdded(false); setAdding(false); }, 2000);
  };

  return (
    <main className="product-detail">
      <div className="product-detail__top page-shell">
        <ProductGallery product={product} />
        <section className="product-detail__purchase" aria-labelledby="product-heading">
          <p className="eyebrow">{product.category}</p>
          <h1 id="product-heading">{product.name}</h1>
          <p className="product-detail__short-description">{product.shortDescription}</p>
          <p className="product-detail__price">
            {formatPrice(price, currency)}
            {compareAtPrice != null ? <del>{formatPrice(compareAtPrice, currency)}</del> : null}
          </p>
          {product.variants.length > 0 ? (
            <fieldset className="product-detail__variants">
              <legend>Choose a size</legend>
              <div className="product-detail__variant-list">
                {product.variants.map((variant) => (
                  <label className="product-detail__variant" key={variant.id}>
                    <input type="radio" name="product-variant" value={variant.id} checked={selectedVariantId === variant.id} onChange={() => setSelectedVariantId(variant.id)} />
                    <span className="product-detail__variant-name">{variant.name}</span>
                    {variant.price !== undefined ? <span className="product-detail__variant-price">{formatPrice(variant.price, variant.currency ?? product.currency)}</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="product-detail__quantity">
            <span id="quantity-label">Quantity</span>
            <div className="quantity-control" aria-labelledby="quantity-label">
              <button type="button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button>
            </div>
          </div>
          <button className="button button--dark product-detail__add" type="button" disabled={!isAvailable || adding} onClick={handleAddToCart}>
            {adding ? (added ? "Added \u2713" : "Adding\u2026") : product.availability === "preorder" ? "Pre-order" : "Add to cart"}
          </button>
          {cartMessage ? <p className="product-detail__cart-message" role="status">{cartMessage}</p> : null}
          <p className="product-detail__availability">{product.availability}</p>
          <p className="product-detail__shipping">{product.shippingInformation ?? "Shipping information will be added when confirmed."}</p>
        </section>
      </div>
      <div className="product-detail__information page-shell">
        <section className="product-detail__description" aria-labelledby="description-heading">
          <p className="eyebrow">The details</p>
          <h2 id="description-heading">About this product</h2>
          <p>{product.description}</p>
        </section>
        {product.ingredients?.length ? <section className="product-detail__content-block"><h2>Ingredients / materials</h2><ul>{product.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul></section> : null}
        {product.usage ? <section className="product-detail__content-block"><h2>Usage</h2><p>{product.usage}</p></section> : null}
        {product.faq?.length ? <section className="product-detail__content-block"><h2>FAQ</h2>{product.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section> : null}
        <section className="product-detail__content-block"><ReviewForm productId={product.id} /></section>
        {relatedProducts.length ? <section className="product-detail__related" aria-labelledby="related-heading"><h2 id="related-heading">Related products</h2><div className="product-grid">{relatedProducts.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}</div></section> : null}
      </div>
    </main>
  );
}
