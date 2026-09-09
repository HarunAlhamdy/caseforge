import { redirect } from "next/navigation";

/** Export lives on the portfolio scoring page. */
export default function Page() {
  redirect("/scoring/portfolio");
}
