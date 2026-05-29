import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LendingPartner, ProductDefinition, ProductType } from "@/types/lms";

interface PartnersContextType {
  partners: LendingPartner[];
  products: ProductDefinition[];
  loading: boolean;
  addPartner: (p: Omit<LendingPartner, "id">) => Promise<LendingPartner>;
  updatePartner: (id: string, patch: Partial<LendingPartner>) => Promise<void>;
  togglePartnerStatus: (id: string) => Promise<void>;
  removePartner: (id: string) => Promise<void>;
  addProduct: (label: string) => Promise<ProductDefinition>;
  updateProduct: (id: string, patch: Partial<ProductDefinition>) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  getProductLabel: (id: string) => string;
  getActivePartnersForProduct: (productId: ProductType | string) => LendingPartner[];
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

function slugify(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

type PartnerRow = {
  id: string; name: string; products: string[]; integration_type: string;
  min_credit_score: number | null; max_foir: number | null; min_income: number | null;
  status: string;
};
type ProductRow = { id: string; slug: string; label: string; status: string; is_custom: boolean };

function rowToPartner(r: PartnerRow): LendingPartner {
  return {
    id: r.id, name: r.name, products: (r.products ?? []) as ProductType[],
    integrationType: (r.integration_type ?? "manual") as LendingPartner["integrationType"],
    minCreditScore: r.min_credit_score ?? 0, maxFoir: r.max_foir ?? 0, minIncome: r.min_income ?? 0,
    status: r.status as "active" | "inactive",
  };
}
function rowToProduct(r: ProductRow): ProductDefinition {
  return { id: r.slug, label: r.label, status: r.status as "active" | "inactive", isCustom: r.is_custom };
}

export function PartnersProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const partnersQ = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lending_partners").select("*").order("name");
      if (error) throw error;
      return (data as PartnerRow[]).map(rowToPartner);
    },
  });

  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("label");
      if (error) throw error;
      return (data as ProductRow[]).map(rowToProduct);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["partners"] });
  const invalidateProducts = () => qc.invalidateQueries({ queryKey: ["products"] });

  const addPartner = useCallback(async (p: Omit<LendingPartner, "id">) => {
    const { data, error } = await supabase.from("lending_partners").insert({
      name: p.name, products: p.products, integration_type: p.integrationType,
      min_credit_score: p.minCreditScore, max_foir: p.maxFoir, min_income: p.minIncome, status: p.status,
    }).select().single();
    if (error) throw error;
    invalidate();
    return rowToPartner(data as PartnerRow);
  }, [qc]);

  const updatePartner = useCallback(async (id: string, patch: Partial<LendingPartner>) => {
    const row: {
      name?: string; products?: string[]; integration_type?: string;
      min_credit_score?: number; max_foir?: number; min_income?: number;
      status?: "active" | "inactive";
    } = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.products !== undefined) row.products = patch.products;
    if (patch.integrationType !== undefined) row.integration_type = patch.integrationType;
    if (patch.minCreditScore !== undefined) row.min_credit_score = patch.minCreditScore;
    if (patch.maxFoir !== undefined) row.max_foir = patch.maxFoir;
    if (patch.minIncome !== undefined) row.min_income = patch.minIncome;
    if (patch.status !== undefined) row.status = patch.status;
    const { error } = await supabase.from("lending_partners").update(row).eq("id", id);
    if (error) throw error;
    invalidate();
  }, [qc]);

  const togglePartnerStatus = useCallback(async (id: string) => {
    const current = (partnersQ.data ?? []).find(p => p.id === id);
    if (!current) return;
    await updatePartner(id, { status: current.status === "active" ? "inactive" : "active" });
  }, [partnersQ.data, updatePartner]);

  const removePartner = useCallback(async (id: string) => {
    const { error } = await supabase.from("lending_partners").delete().eq("id", id);
    if (error) throw error;
    invalidate();
  }, [qc]);

  const addProduct = useCallback(async (label: string) => {
    const slug = slugify(label) || `product_${Date.now()}`;
    const { data, error } = await supabase.from("products").insert({
      slug, label: label.trim(), status: "active", is_custom: true,
    }).select().single();
    if (error) throw error;
    invalidateProducts();
    return rowToProduct(data as ProductRow);
  }, [qc]);

  const updateProduct = useCallback(async (id: string, patch: Partial<ProductDefinition>) => {
    const row: { label?: string; status?: "active" | "inactive" } = {};
    if (patch.label !== undefined) row.label = patch.label;
    if (patch.status !== undefined) row.status = patch.status;
    const { error } = await supabase.from("products").update(row).eq("slug", id);
    if (error) throw error;
    invalidateProducts();
  }, [qc]);

  const toggleProductStatus = useCallback(async (id: string) => {
    const current = (productsQ.data ?? []).find(p => p.id === id);
    if (!current) return;
    await updateProduct(id, { status: current.status === "active" ? "inactive" : "active" });
  }, [productsQ.data, updateProduct]);

  const removeProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("slug", id);
    if (error) throw error;
    invalidateProducts();
  }, [qc]);

  const partners = partnersQ.data ?? [];
  const products = productsQ.data ?? [];

  const getProductLabel = useCallback((id: string) => {
    return products.find(p => p.id === id)?.label ?? id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }, [products]);

  const getActivePartnersForProduct = useCallback((productId: ProductType | string) => {
    return partners.filter(p => p.status === "active" && p.products.includes(productId as ProductType));
  }, [partners]);

  const value = useMemo<PartnersContextType>(() => ({
    partners, products, loading: partnersQ.isLoading || productsQ.isLoading,
    addPartner, updatePartner, togglePartnerStatus, removePartner,
    addProduct, updateProduct, toggleProductStatus, removeProduct,
    getProductLabel, getActivePartnersForProduct,
  }), [partners, products, partnersQ.isLoading, productsQ.isLoading, addPartner, updatePartner, togglePartnerStatus, removePartner, addProduct, updateProduct, toggleProductStatus, removeProduct, getProductLabel, getActivePartnersForProduct]);

  return <PartnersContext.Provider value={value}>{children}</PartnersContext.Provider>;
}

export function usePartners() {
  const ctx = useContext(PartnersContext);
  if (!ctx) throw new Error("usePartners must be used within PartnersProvider");
  return ctx;
}
