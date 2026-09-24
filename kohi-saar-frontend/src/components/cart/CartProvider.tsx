"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";
import type { CartActionResult, CartActions, CartItem, CartLine, CartState } from "@/types/cart";
import type { Product } from "@/types/product";
import { track } from "@/lib/analytics";

const CART_STORAGE_KEY = "kohi-saar-cart";
const SESSION_STORAGE_KEY = "kohi-saar-cart-session";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const MAX_QUANTITY = 99;
const DEFAULT_CURRENCY = "USD";
const CART_SYNC_ERROR = "We could not sync your cart. Your items are saved on this device.";

type CartContextValue = CartState & CartActions & { lines: CartLine[]; itemCount: number; subtotal: number; total: number; currency: string; hydrated: boolean; cartError?: string; refreshCart: () => Promise<void> };
type ProviderState = CartState & { hydrated: boolean; cartError?: string };
type Action = { type: "hydrate"; items: CartItem[]; sessionToken?: string } | { type: "add"; product: Product; quantity: number; variantId: string } | { type: "remove"; productId: string; variantId?: string } | { type: "quantity"; productId: string; quantity: number; variantId?: string } | { type: "clear" } | { type: "error"; message?: string };
interface RemoteCart { id: string; sessionToken: string; items: Array<{ variantId: string; quantity: number; product: { id: string; slug: string; name: string; shortDescription: string; description: string; availability: string; featured: boolean; category: { id: string; name: string; slug: string }; images: Product["images"] }; variant: { id: string; name: string; price: number; compareAtPrice: number | null; currency: string } }>; }

function validQuantity(quantity: number) { return Number.isFinite(quantity) && Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY; }
function itemMatches(item: CartItem, productId: string, variantId?: string) { return item.productId === productId && item.variantId === variantId; }
function reducer(state: ProviderState, action: Action): ProviderState {
  if (action.type === "hydrate") return { ...state, items: action.items, sessionToken: action.sessionToken ?? state.sessionToken, hydrated: true, cartError: undefined };
  if (action.type === "error") return { ...state, cartError: action.message };
  if (action.type === "clear") return { ...state, items: [] };
  if (action.type === "remove") return { ...state, items: state.items.filter((item) => !itemMatches(item, action.productId, action.variantId)) };
  if (action.type === "quantity") return validQuantity(action.quantity) ? { ...state, items: state.items.map((item) => itemMatches(item, action.productId, action.variantId) ? { ...item, quantity: action.quantity } : item) } : state;
  const existing = state.items.find((item) => itemMatches(item, action.product.id, action.variantId));
  if (existing) return { ...state, items: state.items.map((item) => item === existing ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + action.quantity) } : item) };
  return { ...state, items: [...state.items, { productId: action.product.id, quantity: action.quantity, variantId: action.variantId, product: action.product }] };
}
function readStoredItems(): CartItem[] { try { const parsed: unknown = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is CartItem => typeof item === "object" && item !== null && typeof item.productId === "string" && typeof item.quantity === "number" && validQuantity(item.quantity) && (typeof item.variantId === "string" || typeof item.variantId === "undefined")) : []; } catch { return []; } }
function toProduct(item: RemoteCart["items"][number]): Product { return { id: item.product.id, slug: item.product.slug, name: item.product.name, shortDescription: item.product.shortDescription, description: item.product.description, price: item.variant.price, currency: item.variant.currency, compareAtPrice: item.variant.compareAtPrice ?? undefined, availability: item.product.availability.toLowerCase() as Product["availability"], featured: item.product.featured, category: item.product.category.name, variants: [{ id: item.variant.id, name: item.variant.name, price: item.variant.price, compareAtPrice: item.variant.compareAtPrice ?? undefined }], images: item.product.images }; }
function toCartItems(cart: RemoteCart): CartItem[] { return cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity, variantId: item.variantId, product: toProduct(item) })); }
function uniqueItems(items: CartItem[]) { const merged = new Map<string, CartItem>(); for (const item of items) { if (!item.variantId) continue; const key = `${item.productId}:${item.variantId}`; const existing = merged.get(key); merged.set(key, existing ? { ...existing, quantity: Math.min(MAX_QUANTITY, existing.quantity + item.quantity) } : item); } return [...merged.values()]; }
async function fetchCart(sessionToken?: string) { const response = await fetch(`${API_BASE_URL}/cart`, { headers: sessionToken ? { "x-cart-session": sessionToken } : undefined }); if (!response.ok) throw new Error("Cart request failed"); return (await response.json() as { data: RemoteCart }).data; }
async function postCartItem(sessionToken: string, item: CartItem) { const response = await fetch(`${API_BASE_URL}/cart/items`, { method: "POST", headers: { "Content-Type": "application/json", "x-cart-session": sessionToken }, body: JSON.stringify({ variantId: item.variantId, quantity: item.quantity }) }); if (!response.ok) throw new Error("Cart item request failed"); }

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [cartState, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const { items, sessionToken, hydrated, cartError } = cartState;
  const cartStateRef = useRef(cartState);
  const mutationQueueRef = useRef(Promise.resolve());
  const mutationVersionRef = useRef(0);
  useEffect(() => { cartStateRef.current = cartState; }, [cartState]);
  useEffect(() => { const storedItems = readStoredItems(); const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY) ?? undefined; const nextState = reducer(cartStateRef.current, { type: "hydrate", items: storedItems, sessionToken: storedSession }); cartStateRef.current = nextState; dispatch({ type: "hydrate", items: storedItems, sessionToken: storedSession }); }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); if (sessionToken) window.localStorage.setItem(SESSION_STORAGE_KEY, sessionToken); }, [hydrated, items, sessionToken]);

  const applyLocal = (action: Action, isMutation = false) => { if (isMutation) mutationVersionRef.current += 1; const nextState = reducer(cartStateRef.current, action); cartStateRef.current = nextState; dispatch(action); };
  const applyRemote = (cart: RemoteCart) => { const remoteItems = toCartItems(cart); const nextState = reducer(cartStateRef.current, { type: "hydrate", sessionToken: cart.sessionToken, items: remoteItems }); cartStateRef.current = nextState; window.localStorage.setItem(SESSION_STORAGE_KEY, cart.sessionToken); dispatch({ type: "hydrate", sessionToken: cart.sessionToken, items: remoteItems }); };
  const enqueue = (operation: () => Promise<void>) => { const queued = mutationQueueRef.current.then(operation, operation); mutationQueueRef.current = queued.catch(() => undefined); return queued; };
  const syncLocalItems = async (localItems: CartItem[]) => { const cart = await fetchCart(); for (const item of uniqueItems(localItems)) await postCartItem(cart.sessionToken, item); return fetchCart(cart.sessionToken); };
  const syncMutation = (request: () => Promise<RemoteCart | undefined>) => { const requestVersion = mutationVersionRef.current; void enqueue(async () => { try { const cart = await request(); if (cart && requestVersion === mutationVersionRef.current) applyRemote(cart); } catch { applyLocal({ type: "error", message: CART_SYNC_ERROR }); } }); };
  const refreshCart = useCallback(async () => { const requestVersion = mutationVersionRef.current; await enqueue(async () => { const current = cartStateRef.current; if (!current.sessionToken && current.items.length === 0) return; try { const cart = current.sessionToken ? await fetchCart(current.sessionToken) : await syncLocalItems(current.items); if (requestVersion === mutationVersionRef.current) applyRemote(cart); } catch { applyLocal({ type: "error", message: CART_SYNC_ERROR }); } }); }, []);

  const lines = items.map((item): CartLine => { const product = item.product ?? null; const variant = product?.variants.find((candidate) => candidate.id === item.variantId); const unitPrice = variant?.price ?? product?.price ?? 0; const available = product !== null && (product.availability === "available" || product.availability === "preorder") && (!item.variantId || variant !== undefined); return { item, product, variant, available, unitPrice, currency: variant?.currency ?? product?.currency ?? DEFAULT_CURRENCY, lineTotal: unitPrice * item.quantity }; });
  const availableLines = lines.filter((line) => line.available);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const subtotal = availableLines.reduce((total, line) => total + line.lineTotal, 0);
  const currency = availableLines[0]?.currency ?? DEFAULT_CURRENCY;
  const addItem = (product: Product, quantity: number, variantId?: string): CartActionResult => { if (product.availability === "unavailable") return { success: false, message: "This product is currently unavailable." }; if (!validQuantity(quantity)) return { success: false, message: `Choose a quantity between 1 and ${MAX_QUANTITY}.` }; if (!variantId || !product.variants.some((variant) => variant.id === variantId)) return { success: false, message: "Choose an available product option." }; const hadSession = Boolean(cartStateRef.current.sessionToken); applyLocal({ type: "add", product, quantity, variantId }, true); track("add_to_cart", { items: [{ itemId: product.id, itemName: product.name, price: product.variants.find((variant) => variant.id === variantId)?.price, quantity, currency: product.currency }] }); syncMutation(async () => { const current = cartStateRef.current; if (!hadSession) return current.sessionToken ? fetchCart(current.sessionToken) : syncLocalItems(current.items); await postCartItem(current.sessionToken!, { productId: product.id, quantity, variantId, product }); return fetchCart(current.sessionToken!); }); return { success: true }; };
  const removeItem = (productId: string, variantId?: string) => { applyLocal({ type: "remove", productId, variantId }, true); if (!variantId) return; syncMutation(async () => { const current = cartStateRef.current; if (!current.sessionToken) return syncLocalItems(current.items); const response = await fetch(`${API_BASE_URL}/cart/items/${variantId}`, { method: "DELETE", headers: { "x-cart-session": current.sessionToken } }); if (!response.ok) throw new Error("Remove request failed"); return (await response.json() as { data: RemoteCart }).data; }); };
  const updateQuantity = (productId: string, quantity: number, variantId?: string) => { if (quantity < 1) return removeItem(productId, variantId); if (!validQuantity(quantity)) return; applyLocal({ type: "quantity", productId, quantity, variantId }, true); if (!variantId) return; syncMutation(async () => { const current = cartStateRef.current; if (!current.sessionToken) return syncLocalItems(current.items); const response = await fetch(`${API_BASE_URL}/cart/items/${variantId}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-cart-session": current.sessionToken }, body: JSON.stringify({ quantity }) }); if (!response.ok) throw new Error("Quantity request failed"); return (await response.json() as { data: RemoteCart }).data; }); };
  const increaseQuantity = (productId: string, variantId?: string) => updateQuantity(productId, (cartStateRef.current.items.find((item) => itemMatches(item, productId, variantId))?.quantity ?? 0) + 1, variantId);
  const decreaseQuantity = (productId: string, variantId?: string) => updateQuantity(productId, (cartStateRef.current.items.find((item) => itemMatches(item, productId, variantId))?.quantity ?? 1) - 1, variantId);
  const clearCart = () => { const token = cartStateRef.current.sessionToken; applyLocal({ type: "clear" }, true); if (!token) return; syncMutation(async () => { const response = await fetch(`${API_BASE_URL}/cart`, { method: "DELETE", headers: { "x-cart-session": token } }); if (!response.ok && response.status !== 204) throw new Error("Clear request failed"); return fetchCart(token); }); };
  return <CartContext.Provider value={{ items, sessionToken, lines, itemCount, subtotal, total: subtotal, currency, hydrated, cartError, refreshCart, addItem, removeItem, updateQuantity, increaseQuantity, decreaseQuantity, clearCart }}>{children}</CartContext.Provider>;
}

const CartContext = createContext<CartContextValue | null>(null);
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used within CartProvider"); return context; }
