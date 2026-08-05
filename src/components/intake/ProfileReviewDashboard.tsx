"use client";

import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/Badge";

export function ProfileReviewDashboard() {
  const { data, isLoading } = trpc.profileReview.getMyQueue.useQuery();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading profile reviews…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">UC #</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Section</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Days open</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((review) => (
            <tr key={review.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link
                  href={`/review/profiles/${review.id}`}
                  className="font-medium text-brand-primary hover:underline"
                >
                  {review.useCase.useCaseNumber}
                </Link>
              </td>
              <td className="px-4 py-3">{review.useCase.title}</td>
              <td className="px-4 py-3">{review.section.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">
                <Badge variant="info">{review.status}</Badge>
              </td>
              <td className="px-4 py-3">{review.daysOpen}d</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data ?? []).length === 0 ? (
        <p className="p-6 text-sm text-slate-500">No profile reviews in your queue.</p>
      ) : null}
    </div>
  );
}
