"use client";

import { useEffect } from "react";
import type { TenantThemeConfig } from "@/lib/types";
import { applyTenantTheme } from "@/lib/utils/tenant-theme";

export interface TenantBrandProps {
  theme: TenantThemeConfig;
  children: React.ReactNode;
}

export function TenantBrand({ theme, children }: TenantBrandProps) {
  useEffect(() => {
    applyTenantTheme(theme);
  }, [theme]);

  return (
    <div
      style={
        {
          "--brand-primary": theme.primaryColor,
          "--brand-accent": theme.accentColor,
          "--brand-font": theme.fontFamily,
        } as React.CSSProperties
      }
      className="min-h-screen font-[family-name:var(--brand-font)]"
    >
      {children}
    </div>
  );
}
