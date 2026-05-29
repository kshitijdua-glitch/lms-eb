import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LendingPartner, ProductDefinition, ProductType } from "@/types/lms";
import { lendingPartners as seedPartners } from "@/data/mockData";

const BUILTIN_PRODUCTS: ProductDefinition[] = [
  { id: "personal_loan", label: "Personal Loan", status: "active" },
  { id: "home_loan", label: "Home Loan", status: "active" },
  { id: "business_loan", label: "Business Loan", status: "active" },
  { id: "credit_card", label: "Credit Card", status: "active" },
  { id: "loan_against_property", label: "Loan Against Property", status: "active" },
];

interface PartnersContextType {
  partners: LendingPartner[];
  products: ProductDefinition[];
  addPartner: (p: Omit<LendingPartner, "id">) => LendingPartner;
  updatePartner: (id: string, patch: Partial<LendingPartner>) => void;
  togglePartnerStatus: (id: string) => void;
  removePartner: (id: string) => void;
  addProduct: (label: string) => ProductDefinition;
  updateProduct: (id: string, patch: Partial<ProductDefinition>) => void;
  toggleProductStatus: (id: string) => void;
  removeProduct: (id: string) => void;
  getProductLabel: (id: string) => string;
  getActivePartnersForProduct: (productId: ProductType | string) => LendingPartner[];
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

const PARTNERS_KEY = "lms-partners";
const PRODUCTS_KEY = "lms-products";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function slugify(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function PartnersProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<LendingPartner[]>(() => load(PARTNERS_KEY, seedPartners));
  const [products, setProducts] = useState<ProductDefinition[]>(() => load(PRODUCTS_KEY, BUILTIN_PRODUCTS));

  useEffect(() => {
    try { sessionStorage.setItem(PARTNERS_KEY, JSON.stringify(partners)); } catch { /* noop */ }
  }, [partners]);

  useEffect(() => {
    try { sessionStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); } catch { /* noop */ }
  }, [products]);

  const addPartner = useCallback((p: Omit<LendingPartner, "id">) => {
    const created: LendingPartner = { ...p, id: `lp-${Date.now()}` };
    setPartners(prev => [...prev, created]);
    return created;
  }, []);

  const updatePartner = useCallback((id: string, patch: Partial<LendingPartner>) => {
    setPartners(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const togglePartnerStatus = useCallback((id: string) => {
    setPartners(prev => prev.map(p => (p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)));
  }, []);

  const removePartner = useCallback((id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  }, []);

  const addProduct = useCallback((label: string) => {
    const id = slugify(label) || `product_${Date.now()}`;
    const created: ProductDefinition = { id, label: label.trim(), status: "active", isCustom: true };
    setProducts(prev => (prev.some(p => p.id === id) ? prev : [...prev, created]));
    return created;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<ProductDefinition>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const toggleProductStatus = useCallback((id: string) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p)));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => !(p.id === id && p.isCustom)));
  }, []);

  const getProductLabel = useCallback((id: string) => {
    return products.find(p => p.id === id)?.label ?? id.replace(/_/g, " ");
  }, [products]);

  const getActivePartnersForProduct = useCallback((productId: ProductType | string) => {
    return partners.filter(p => p.status === "active" && p.products.includes(productId as ProductType));
  }, [partners]);

  const value = useMemo(() => ({
    partners, products,
    addPartner, updatePartner, togglePartnerStatus, removePartner,
    addProduct, updateProduct, toggleProductStatus, removeProduct,
    getProductLabel, getActivePartnersForProduct,
  }), [partners, products, addPartner, updatePartner, togglePartnerStatus, removePartner, addProduct, updateProduct, toggleProductStatus, removeProduct, getProductLabel, getActivePartnersForProduct]);

  return <PartnersContext.Provider value={value}>{children}</PartnersContext.Provider>;
}

export function usePartners() {
  const ctx = useContext(PartnersContext);
  if (!ctx) throw new Error("usePartners must be used within PartnersProvider");
  return ctx;
}
