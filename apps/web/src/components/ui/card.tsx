import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "card-surface rounded-2xl p-6 shadow-sm transition-smooth",
        className
      )}
      {...props}
    />
  );
}
