import Link from "next/link";

export interface AppPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AppPage({ title, description, children }: AppPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
      </div>
      {children}
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-medium text-brand-primary hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
