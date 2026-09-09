"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Globe2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc/react";
import { useAccess } from "@/hooks/use-access";
import { useAppStore } from "@/stores/app-store";
import { applyTenantTheme } from "@/lib/utils/tenant-theme";
import { SECURITY_ROLE_LABELS } from "@/lib/constants/enums";
import { cn } from "@/lib/utils/format";

export function TenantSwitcher() {
  const { isPartnerUser, isPlatformAdmin } = useAccess();
  const { activeTenantId, setActiveTenantId, setTenantTheme } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: tenants = [], isLoading } = trpc.tenant.listAccessible.useQuery(
    undefined,
    { enabled: isPartnerUser || isPlatformAdmin },
  );

  const setActive = trpc.tenant.setActive.useMutation({
    onSuccess: (result) => {
      setActiveTenantId(result.tenantId);
      setTenantTheme(result.theme);
      applyTenantTheme(result.theme);
      void queryClient.invalidateQueries();
      setOpen(false);
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isPartnerUser && !isPlatformAdmin) {
    return null;
  }

  const currentId = activeTenantId;
  const selected = tenants.find((t) => t.id === currentId);
  const label = selected?.name ?? (currentId === null ? "Cross-customer view" : "Select tenant");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isLoading || setActive.isPending}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          <li role="option" aria-selected={currentId === null}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                currentId === null && "bg-brand-primary/5 text-brand-primary",
              )}
              onClick={() => setActive.mutate({ tenantId: null })}
            >
              <Globe2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              <div>
                <div className="font-medium">Cross-customer view</div>
                <div className="text-xs text-slate-500">Partner-wide dashboard</div>
              </div>
            </button>
          </li>

          {tenants.map((tenant) => (
            <li
              key={tenant.id}
              role="option"
              aria-selected={tenant.id === currentId}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                  tenant.id === currentId &&
                    "bg-brand-primary/5 text-brand-primary",
                )}
                onClick={() => setActive.mutate({ tenantId: tenant.id })}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: tenant.primaryColor ?? "#0f766e",
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{tenant.name}</div>
                  <div className="text-xs text-slate-500">
                    {SECURITY_ROLE_LABELS[
                      tenant.roleInTenant as keyof typeof SECURITY_ROLE_LABELS
                    ] ?? tenant.roleInTenant}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
