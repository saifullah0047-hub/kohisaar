import type { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="shop-empty-state" role="status">
        <h2>Nothing here yet.</h2>
        <p>Check back soon.</p>
      </div>
    );
  }

  const featured = products.filter((p) => p.featured);
  const regular = products.filter((p) => !p.featured);

  return (
    <div>
      {featured.length > 0 && (
        <div className="shop-featured">
          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                catalogPosition={index + 1}
                catalogTotal={featured.length}
              />
            ))}
          </div>
        </div>
      )}
      {regular.length > 0 && (
        <div className="product-grid">
          {regular.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              catalogPosition={featured.length + index + 1}
              catalogTotal={products.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
