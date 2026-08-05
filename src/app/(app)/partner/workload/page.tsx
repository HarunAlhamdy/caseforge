"use client";

import { AppPage } from "@/components/layout/AppPage";
import { trpc } from "@/trpc/react";
import { emptyChartMessage } from "@/components/dashboard/chart-theme";

export default function PartnerWorkloadPage() {
  const { data, isLoading } = trpc.dashboard.partnerWorkload.useQuery();

  return (
    <AppPage
      title="Partner Workload"
      description="Consultant assignments and customer coverage."
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !data?.workloadByConsultant.length ? (
        emptyChartMessage("consultant workload")
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-600">
                <th className="p-3">Consultant</th>
                <th className="p-3">Assignments</th>
                <th className="p-3">Customers</th>
              </tr>
            </thead>
            <tbody>
              {data.workloadByConsultant.map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{row.assignments}</td>
                  <td className="p-3">{row.customers.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppPage>
  );
}
