"use client";

import { useState } from "react";
import { AppPage } from "@/components/layout/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ConsultantManagement } from "@/components/admin/ConsultantManagement";
import { CustomerAssignmentMatrix } from "@/components/admin/CustomerAssignmentMatrix";
import { PartnerSettings } from "@/components/admin/PartnerSettings";

const TABS = [
  { id: "consultants", label: "Consultants" },
  { id: "assignments", label: "Customer Assignment" },
  { id: "settings", label: "Partner Settings" },
];

export function PartnerAdminClient() {
  const [activeTab, setActiveTab] = useState("consultants");

  return (
    <AppPage
      title="Partner Admin"
      description="Partner-level user and tenant administration."
    >
      <section className="mt-6 space-y-6">
        <AdminTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "consultants" ? <ConsultantManagement /> : null}
        {activeTab === "assignments" ? <CustomerAssignmentMatrix /> : null}
        {activeTab === "settings" ? <PartnerSettings /> : null}
      </section>
    </AppPage>
  );
}
