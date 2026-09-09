import { redirect } from "next/navigation";

/** Legacy empty hub — send users to the portfolio picker. */
export default function Page() {
  redirect("/scoring/portfolio");
}
