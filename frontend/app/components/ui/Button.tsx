import { clsx } from "clsx";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "error";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles = "btn-panel font-heading cursor-pointer";

  const variantStyles = {
    primary: "bg-primary/12 text-primary border-primary/25 hover:bg-primary/20 hover:border-primary/40",
    secondary: "bg-secondary/12 text-secondary border-secondary/25 hover:bg-secondary/20 hover:border-secondary/40",
    accent: "bg-accent/12 text-accent border-accent/25 hover:bg-accent/20 hover:border-accent/40",
    ghost: "bg-transparent border-transparent shadow-none hover:bg-base-200/50",
    error: "bg-error/12 text-error border-error/25 hover:bg-error/20 hover:border-error/40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    await onClick?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        "touch-target",
        loading && "loading",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      type={type}
      {...props}
    >
      {loading ? <span className="loading loading-spinner loading-sm" /> : children}
    </button>
  );
}
