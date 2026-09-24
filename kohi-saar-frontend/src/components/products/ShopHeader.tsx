"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type SortOption = "newest" | "name" | "price-asc" | "price-desc";
interface Category { id: string; name: string; slug: string; }

interface ShopToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (slug: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  categories: Category[];
  total: number;
  loading: boolean;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function SortDropdown({ sort, onSortChange }: { sort: SortOption; onSortChange: (sort: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const labels: Record<SortOption, string> = { newest: "Newest", name: "Name A\u2011Z", "price-asc": "Price: Low to High", "price-desc": "Price: High to Low" };

  return (
    <div className="shop-dropdown" ref={ref}>
      <button type="button" className="shop-dropdown__trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="sort-panel">
        {labels[sort]}
      </button>
      {open ? (
        <div className="shop-dropdown__panel" id="sort-panel" role="listbox" aria-label="Sort products">
          {(["newest", "name", "price-asc", "price-desc"] as const).map((option) => (
            <button key={option} type="button" role="option" aria-selected={sort === option} className={`shop-dropdown__item${sort === option ? " shop-dropdown__item--active" : ""}`} onClick={() => { onSortChange(option); setOpen(false); }}>
              {labels[option]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CategoryDropdown({ category, onCategoryChange, categories }: { category: string; onCategoryChange: (slug: string) => void; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const activeLabel = categories.find((c) => c.slug === category)?.name;

  return (
    <div className="shop-dropdown" ref={ref}>
      <button type="button" className="shop-dropdown__trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="category-panel">
        {activeLabel || "All Categories"}
      </button>
      {open ? (
        <div className="shop-dropdown__panel" id="category-panel" role="listbox" aria-label="Filter by category">
          <button type="button" role="option" aria-selected={!category} className={`shop-dropdown__item${!category ? " shop-dropdown__item--active" : ""}`} onClick={() => { onCategoryChange(""); setOpen(false); }}>
            All Categories
          </button>
          {categories.map((cat) => (
            <button key={cat.id} type="button" role="option" aria-selected={category === cat.slug} className={`shop-dropdown__item${category === cat.slug ? " shop-dropdown__item--active" : ""}`} onClick={() => { onCategoryChange(cat.slug); setOpen(false); }}>
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ShopToolbar({ search, onSearchChange, category, onCategoryChange, sort, onSortChange, categories, total, loading }: ShopToolbarProps) {
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); };

  return (
    <div className="shop-toolbar">
      <div className="shop-toolbar__meta">
        <span className="shop-toolbar__count">
          {loading ? "Loading\u2026" : `${total} ${total === 1 ? "product" : "products"}`}
        </span>
      </div>

      <div className="shop-toolbar__controls">
        <form className="shop-search form-doodle-surface" onSubmit={handleSubmit} role="search">
          <svg className="shop-search__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search" aria-label="Search products" />
        </form>
        <CategoryDropdown category={category} onCategoryChange={onCategoryChange} categories={categories} />
        <SortDropdown sort={sort} onSortChange={onSortChange} />
      </div>
    </div>
  );
}
