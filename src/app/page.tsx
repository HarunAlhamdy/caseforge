import { redirect } from "next/navigation";

/** Avoid pulling Prisma/auth into `/` — that was crashing SSR when client wasn't generated. */
export default function HomePage() {
  redirect("/login");
}
