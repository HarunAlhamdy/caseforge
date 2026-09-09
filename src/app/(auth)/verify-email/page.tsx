"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          return;
        }
        setStatus("ok");
        setMessage("Your email has been verified. You can now sign in.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error — please try again.");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Verifying…</h1>
            <p className="mt-1 text-sm text-stone-500">{message}</p>
          </div>
        </div>
      )}

      {status === "ok" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Email verified</h1>
            <p className="mt-1 text-sm text-stone-500">{message}</p>
          </div>
          <Link href="/login" className="mt-2 block w-full">
            <Button className="w-full" size="lg">Go to sign in</Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Verification failed</h1>
            <p className="mt-1 text-sm text-stone-500">{message}</p>
          </div>
          <Link href="/login" className="mt-2 block w-full">
            <Button variant="secondary" className="w-full" size="lg">Back to sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen">
      <AuthHeroPanel />

      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 lg:px-16">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
              <p className="text-sm text-stone-500">Verifying your email…</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
