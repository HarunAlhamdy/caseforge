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

export function BreadcrumbBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-slate-50 px-4 py-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 hover:text-brand-primary"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span>Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const label =
            segment.startsWith("[") || segment.length > 20
              ? "Detail"
              : titleCase(segment);

          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {isLast ? (
                <span aria-current="page" className="font-medium text-slate-900">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-brand-primary">
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
