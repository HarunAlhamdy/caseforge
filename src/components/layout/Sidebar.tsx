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
    href: "/architecture/demo",
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
    href: "/evaluation/demo",
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
    href: "/financial",
    label: "Financial",
    icon: BarChart3,
    roles: [
      SecurityRole.EXECUTIVE_SPONSOR,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/criteria",
    label: "Criteria",
    icon: FileText,
    roles: [
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.PARTNER_ADMIN,
      SecurityRole.PLATFORM_SUPER_ADMIN,
    ],
  },
  {
    href: "/scorecard",
    label: "Scorecard",
    icon: FileText,
    roles: [
      SecurityRole.EXECUTIVE_SPONSOR,
      SecurityRole.PORTFOLIO_MANAGER,
      SecurityRole.CUSTOMER_ADMIN,
      SecurityRole.VIEWER,
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

  if (
    access.accessLevel === "PARTNER" &&
    access.tenantId === null &&
    item.href.startsWith("/intake")
  ) {
    return false;
  }

  return true;
}

function NavSection({
  items,
  collapsed,
  pathname,
  access,
}: {
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  access: AccessContext | null;
}) {
  const visible = items.filter((item) => isNavItemVisible(item, access));

  if (visible.length === 0) return null;

  return (
    <ul className="space-y-1">
      {visible.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { access } = useAccess();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white transition-all",
        sidebarCollapsed ? "w-16" : "w-64",
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
        {!sidebarCollapsed ? (
          <span className="text-sm font-bold text-brand-primary">CaseForge</span>
        ) : (
          <span className="mx-auto text-sm font-bold text-brand-primary">CF</span>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <NavSection
          items={mainNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
        <NavSection
          items={partnerNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
        <NavSection
          items={adminNav}
          collapsed={sidebarCollapsed}
          pathname={pathname}
          access={access}
        />
      </nav>
    </aside>
  );
}
