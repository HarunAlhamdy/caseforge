"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileInput,
  ClipboardCheck,
  BarChart3,
  Layers,
  FlaskConical,
  Truck,
  Settings2,
  Users,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useAppStore } from "@/stores/app-store";
import { useAccess } from "@/hooks/use-access";
import { SecurityRole } from "@/lib/constants/enums";
import type { AccessContext } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  accessLevels?: AccessContext["accessLevel"][];
  minRoles?: string[];
}

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    minRoles: Object.values(SecurityRole),
  },
  {
    href: "/intake",
    label: "Intake",
    icon: FileInput,
    roles: [
      SecurityRole.SUBMITTER,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.EVALUATOR,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/review/queue",
    label: "Review Queue",
    icon: ClipboardCheck,
    roles: [
      SecurityRole.EVALUATOR,
      SecurityRole.DATA_SECURITY_REVIEWER,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/review/profiles",
    label: "Profile Reviews",
    icon: ClipboardCheck,
    roles: [
      SecurityRole.EVALUATOR,
      SecurityRole.DATA_SECURITY_REVIEWER,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/scoring/portfolio",
    label: "Portfolio Scoring",
    icon: BarChart3,
    roles: [
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.EXECUTIVE_SPONSOR,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/architecture",
    label: "Architecture",
    icon: Layers,
    roles: [
      SecurityRole.EVALUATOR,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/evaluation",
    label: "Evaluation",
    icon: FlaskConical,
    roles: [
      SecurityRole.EVALUATOR,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/delivery/waves",
    label: "Delivery",
    icon: Truck,
    roles: [
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PARTNER_CONSULTANT,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/operations",
    label: "Operations",
    icon: Settings2,
    roles: [
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/reports/gate-report",
    label: "Reports",
    icon: FileText,
    roles: [
      SecurityRole.EXECUTIVE_SPONSOR,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
];

const partnerNav: NavItem[] = [
  {
    href: "/partner/dashboard",
    label: "Partner Dashboard",
    icon: Users,
    accessLevels: ["PARTNER", "PLATFORM"],
  },
  {
    href: "/partner/workload",
    label: "Workload",
    icon: Users,
    accessLevels: ["PARTNER", "PLATFORM"],
    roles: [SecurityRole.PARTNER_ADMIN, SecurityRole.PLATFORM_SUPER_ADMIN],
  },
  {
    href: "/partner/health",
    label: "Partner Health",
    icon: Users,
    accessLevels: ["PARTNER", "PLATFORM"],
    roles: [SecurityRole.PARTNER_ADMIN, SecurityRole.PLATFORM_SUPER_ADMIN],
  },
];

const adminNav: NavItem[] = [
  {
    href: "/admin/platform",
    label: "Platform Admin",
    icon: Shield,
    roles: [SecurityRole.PLATFORM_SUPER_ADMIN],
  },
  {
    href: "/admin/partner",
    label: "Partner Admin",
    icon: Shield,
    roles: [SecurityRole.PLATFORM_SUPER_ADMIN, SecurityRole.PARTNER_ADMIN],
  },
  {
    href: "/admin/customer",
    label: "Customer Admin",
    icon: Shield,
    roles: [
      SecurityRole.PLATFORM_SUPER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.CUSTOMER_ADMIN,
    ],
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: ScrollText,
    roles: [
      SecurityRole.PLATFORM_SUPER_ADMIN,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.CUSTOMER_ADMIN,
    ],
  },
];

function isNavItemVisible(item: NavItem, access: AccessContext | null): boolean {
  if (!access) return false;

  if (item.accessLevels && !item.accessLevels.includes(access.accessLevel)) {
    return false;
  }

  if (item.roles && !item.roles.includes(access.effectiveRole)) {
    return false;
  }

  if (item.minRoles && !item.minRoles.includes(access.effectiveRole)) {
    return false;
  }

  if (
    access.accessLevel === "PARTNER" &&
    access.tenantId === null &&
    item.href.startsWith("/intake")
  ) {
    return false;
  }

  return true;
}

function NavGroup({
  label,
  items,
  collapsed,
  pathname,
  access,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  access: AccessContext | null;
}) {
  const visible = items.filter((item) => isNavItemVisible(item, access));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {visible.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={`${item.label}-${item.href}`}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-teal-300" : "text-stone-400 group-hover:text-stone-600",
                  )}
                  aria-hidden
                />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { access } = useAccess();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-stone-200 bg-[#f7f5f2] transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-stone-200/80 px-3">
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-900">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <rect x="2" y="2" width="4" height="4" rx="1" fill="#5eead4" />
                <rect x="8" y="2" width="4" height="4" rx="1" fill="white" opacity="0.85" />
                <rect x="2" y="8" width="4" height="4" rx="1" fill="white" opacity="0.85" />
                <rect x="8" y="8" width="4" height="4" rx="1" fill="#5eead4" opacity="0.7" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-stone-900">
                CaseForge
              </span>
              <span className="block text-[10px] font-medium text-stone-400">
                AI lifecycle
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-stone-900"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="2" y="2" width="4" height="4" rx="1" fill="#5eead4" />
              <rect x="8" y="8" width="4" height="4" rx="1" fill="#5eead4" opacity="0.7" />
            </svg>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3 pt-4">
        <NavGroup
          label="Workspace"
          items={mainNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
        <NavGroup
          label="Partner"
          items={partnerNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
        <NavGroup
          label="Admin"
          items={adminNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
      </nav>

      {!sidebarCollapsed ? (
        <div className="m-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Tip
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            Start with Intake, then move cases through review and scoring.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
