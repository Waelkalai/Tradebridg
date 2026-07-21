import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-smooth placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
