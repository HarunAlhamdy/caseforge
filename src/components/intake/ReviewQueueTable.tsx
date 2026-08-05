"use client";

import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";

export function ReviewQueueTable() {
  const { data, isLoading } = trpc.usecase.getReviewQueue.useQuery();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading review queue…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">UC #</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Business unit</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Days waiting</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((item) => (
            <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link
                  href={`/review/gate/${item.id}`}
                  className="font-medium text-brand-primary hover:underline"
                >
                  {item.useCaseNumber}
                </Link>
              </td>
              <td className="px-4 py-3">{item.title}</td>
              <td className="px-4 py-3">{item.businessUnit}</td>
              <td className="px-4 py-3">{formatDate(item.dateSubmitted)}</td>
              <td className="px-4 py-3">
                <Badge variant={item.daysWaiting > 7 ? "warning" : "default"}>
                  {item.daysWaiting}d
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data ?? []).length === 0 ? (
        <p className="p-6 text-sm text-slate-500">No cases pending review.</p>
      ) : null}
    </div>
  );
}
