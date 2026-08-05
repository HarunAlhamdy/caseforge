import { format as dateFnsFormat, parseISO } from "date-fns";

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  value: Date | string,
  pattern = "MMM d, yyyy",
): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return dateFnsFormat(date, pattern);
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
