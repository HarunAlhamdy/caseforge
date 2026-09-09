import { handlers } from "@/server/auth/config";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const { GET, POST } = handlers;
