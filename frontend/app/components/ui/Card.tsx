import { clsx } from "clsx";
import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "primary" | "secondary" | "accent";
}

export function Card({ title, children, className, style, variant = "default" }: CardProps) {
  const variantStyles = {
    default: "bg-base-100",
    primary: "bg-primary/5 border-primary/20",
    secondary: "bg-secondary/5 border-secondary/20",
    accent: "bg-accent/5 border-accent/20",
  };

  return (
    <div className={clsx("card-panel p-6", variantStyles[variant], className)} style={style}>
      {title && (
        <h3 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
          {typeof title === "string" ? (
            <span className="underline-accent">{title}</span>
          ) : (
            title
          )}
        </h3>
      )}
      {children}
    </div>
  );
}
