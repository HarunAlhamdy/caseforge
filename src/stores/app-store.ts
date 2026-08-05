import { create } from "zustand";
import type { TenantThemeConfig } from "@/lib/types";
import { getDefaultTenantTheme } from "@/lib/utils/tenant-theme";

interface AppState {
  sidebarCollapsed: boolean;
  activeTenantId: string | null;
  tenantTheme: TenantThemeConfig;
  toggleSidebar: () => void;
  setActiveTenantId: (tenantId: string | null) => void;
  setTenantTheme: (theme: TenantThemeConfig) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  activeTenantId: null,
  tenantTheme: getDefaultTenantTheme(),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveTenantId: (tenantId) => set({ activeTenantId: tenantId }),
  setTenantTheme: (theme) => set({ tenantTheme: theme }),
}));
