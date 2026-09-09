"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName: organizationName || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        verificationSent?: boolean;
      };

      if (!res.ok) {
        setError(data.error || "Could not create account");
        setLoading(false);
        return;
      }

      setSuccess(
        data.verificationSent
          ? "Account created! Check your email for a verification link before signing in."
          : "Account created, but the verification email could not be sent. Sign in and use Resend verification, or contact an admin.",
      );
      setLoading(false);
      window.setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
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

          <h1 className="text-2xl font-bold text-stone-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Provision your workspace and start the AI lifecycle.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Work email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Organization"
              name="organizationName"
              autoComplete="organization"
              placeholder="Acme Corp (optional)"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </p>
            ) : null}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-teal-700 hover:text-teal-800 hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
