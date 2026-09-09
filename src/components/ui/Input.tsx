import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/format";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-stone-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm",
            "text-stone-900 placeholder:text-stone-400",
            "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/30",
            "transition-colors duration-150",
            error && "border-red-400 focus:border-red-500 focus:ring-red-200",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
