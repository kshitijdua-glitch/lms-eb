import React, { createContext, useContext, useState, ReactNode } from "react";
import { PriorityConfig, defaultPriorityConfig } from "@/utils/priorityEngine";

interface PriorityConfigContextType {
  config: PriorityConfig;
  updateConfig: (config: PriorityConfig) => void;
}

const PriorityConfigContext = createContext<PriorityConfigContextType | undefined>(undefined);

export function PriorityConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PriorityConfig>(defaultPriorityConfig);

  return (
    <PriorityConfigContext.Provider value={{ config, updateConfig: setConfig }}>
      {children}
    </PriorityConfigContext.Provider>
  );
}

export function usePriorityConfig() {
  const ctx = useContext(PriorityConfigContext);
  if (!ctx) throw new Error("usePriorityConfig must be used within PriorityConfigProvider");
  return ctx;
}
