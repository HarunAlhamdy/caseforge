import { redirect } from "next/navigation";

/** Hub — pick a use case from portfolio for evaluation work. */
export default function Page() {
  redirect("/scoring/portfolio");
}
