"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setUnverifiedEmail(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        email?: string;
      };

      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(data.email ?? email);
          setError(data.error || "Your email is not verified.");
        } else {
          setError(data.error || "Invalid email or password");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  async function handleResend() {
    const target = unverifiedEmail ?? email;
    if (!target) return;
    setResending(true);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not resend verification email");
      } else {
        setInfo(
          data.message ||
            "If an unverified account exists, a verification link has been sent.",
        );
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthHeroPanel />

      {/* Right: form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only wordmark */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700">
              <span className="text-xs font-bold text-white">CF</span>
            </div>
            <span className="font-bold text-stone-900">CaseForge</span>
          </div>

          <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Sign in to your CaseForge workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {unverifiedEmail ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending}
                  className="mt-2 font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              </div>
            ) : error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {info ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {info}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-teal-700 hover:text-teal-800 hover:underline underline-offset-2"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
