import type { TenantThemeConfig } from "@/lib/types";

export function applyTenantTheme(config: TenantThemeConfig): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--brand-primary", config.primaryColor);
  root.style.setProperty("--brand-accent", config.accentColor);
  if (config.fontFamily) {
    root.style.setProperty("--brand-font", config.fontFamily);
  }
}

export function getDefaultTenantTheme(): TenantThemeConfig {
  return {
    primaryColor: "#0f766e",
    accentColor: "#14b8a6",
    fontFamily: "Inter, system-ui, sans-serif",
  };
}
