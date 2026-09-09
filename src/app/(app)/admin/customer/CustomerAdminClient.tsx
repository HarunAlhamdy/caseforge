"use client";

import { useState } from "react";
import { AppPage } from "@/components/layout/AppPage";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { TenantSettings } from "@/components/admin/TenantSettings";
import { ScoringModelConfig } from "@/components/admin/ScoringModelConfig";
import { WeightHistory } from "@/components/admin/WeightHistory";
import { IntakeFormConfigEditor } from "@/components/admin/IntakeFormConfigEditor";
import { FeasibilityConfigEditor } from "@/components/admin/FeasibilityConfigEditor";
import { HardGateConfigEditor } from "@/components/admin/HardGateConfigEditor";
import { NotificationConfigEditor } from "@/components/admin/NotificationConfigEditor";
import { CustomerAdminUsers } from "@/components/admin/CustomerAdminUsers";

const TABS = [
  { id: "settings", label: "Tenant Settings" },
  { id: "scoring", label: "Scoring Model" },
  { id: "history", label: "Weight History" },
  { id: "intake", label: "Intake Form" },
  { id: "feasibility", label: "Feasibility" },
  { id: "gates", label: "Hard Gates" },
  { id: "notifications", label: "Notifications" },
  { id: "users", label: "Users" },
];

export function CustomerAdminClient() {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <AppPage
      title="Customer Admin"
      description="Customer tenant user management and settings."
    >
      <section className="mt-6 space-y-6">
        <AdminTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "settings" ? <TenantSettings /> : null}
        {activeTab === "scoring" ? <ScoringModelConfig /> : null}
        {activeTab === "history" ? <WeightHistory /> : null}
        {activeTab === "intake" ? <IntakeFormConfigEditor /> : null}
        {activeTab === "feasibility" ? <FeasibilityConfigEditor /> : null}
        {activeTab === "gates" ? <HardGateConfigEditor /> : null}
        {activeTab === "notifications" ? <NotificationConfigEditor /> : null}
        {activeTab === "users" ? <CustomerAdminUsers /> : null}
      </section>
    </AppPage>
  );
}
