"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const HUB_REDIRECTS: Record<string, string> = {
  evaluation: "/scoring/portfolio",
  architecture: "/scoring/portfolio",
  scoring: "/scoring/portfolio",
  admin: "/dashboard",
  delivery: "/delivery/waves",
  review: "/review/queue",
  intake: "/intake",
  partner: "/partner/dashboard",
  operations: "/operations",
  usecase: "/dashboard",
};

export function BreadcrumbBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="relative z-10 shrink-0 border-b border-stone-200 bg-white px-5 py-2.5"
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm text-stone-500">
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-medium text-stone-600 hover:text-stone-900"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span>Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const pathSoFar = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const hub = HUB_REDIRECTS[segment];
          const href =
            !isLast && hub && index === segments.indexOf(segment)
              ? hub
              : pathSoFar;
          const label =
            segment.startsWith("[") || segment.length > 20
              ? "Detail"
              : titleCase(segment);

          return (
            <li key={pathSoFar} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-stone-300" aria-hidden />
              {isLast ? (
                <span aria-current="page" className="font-semibold text-stone-900">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-stone-900">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
