import { AppPage } from "@/components/layout/AppPage";
import { PortfolioTable } from "@/components/scoring/PortfolioTable";

export default function Page() {
  return (
    <AppPage
      title="Portfolio Scoring"
      description="Stage 3B — ranked portfolio view with composite scores."
    >
      <PortfolioTable />
    </AppPage>
  );
}
