"use client";

import { useState } from "react";
import { AppPage } from "@/components/layout/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { PartnerManagement } from "@/components/admin/PartnerManagement";
import { TenantProvisioning } from "@/components/admin/TenantProvisioning";
import { GlobalConfigEditor } from "@/components/admin/GlobalConfigEditor";

const TABS = [
  { id: "partners", label: "Partners" },
  { id: "tenants", label: "Tenants" },
  { id: "global", label: "Global Config" },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState("partners");

  return (
    <AppPage
      title="Platform Admin"
      description="Platform super-admin configuration and tenant management."
    >
      <section className="mt-6 space-y-6">
        <AdminTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "partners" ? <PartnerManagement /> : null}
        {activeTab === "tenants" ? <TenantProvisioning /> : null}
        {activeTab === "global" ? <GlobalConfigEditor /> : null}
      </section>
    </AppPage>
  );
}
