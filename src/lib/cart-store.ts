import { useSyncExternalStore } from "react";

type CartMap = Record<string, number>;
type State = { cart: CartMap; wishlist: string[] };

const STORAGE_CART = "outfizio_cart";
const STORAGE_WISHLIST = "outfizio_wishlist";

let state: State = { cart: {}, wishlist: [] };
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const c = sessionStorage.getItem(STORAGE_CART);
    const w = sessionStorage.getItem(STORAGE_WISHLIST);
    state = {
      cart: c ? JSON.parse(c) : {},
      wishlist: w ? JSON.parse(w) : [],
    };
  } catch {
    state = { cart: {}, wishlist: [] };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_CART, JSON.stringify(state.cart));
  sessionStorage.setItem(STORAGE_WISHLIST, JSON.stringify(state.wishlist));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

let loaded = false;
function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    load();
    loaded = true;
  }
}

export const cartStore = {
  subscribe(fn: () => void) {
    ensureLoaded();
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): State {
    ensureLoaded();
    return state;
  },
  getServerSnapshot(): State {
    return { cart: {}, wishlist: [] };
  },
  addToCart(id: string, qty = 1) {
    state = { ...state, cart: { ...state.cart, [id]: (state.cart[id] || 0) + qty } };
    emit();
  },
  setQty(id: string, qty: number) {
    const next = { ...state.cart };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    state = { ...state, cart: next };
    emit();
  },
  removeFromCart(id: string) {
    const next = { ...state.cart };
    delete next[id];
    state = { ...state, cart: next };
    emit();
  },
  toggleWishlist(id: string): boolean {
    const has = state.wishlist.includes(id);
    state = {
      ...state,
      wishlist: has ? state.wishlist.filter((x) => x !== id) : [...state.wishlist, id],
    };
    emit();
    return !has;
  },
};

export function useCartStore() {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
}
