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
  const baseStyles = "btn-forge font-heading cursor-pointer";

  const variantStyles = {
    primary: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25",
    secondary: "bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25",
    accent: "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25",
    ghost: "bg-transparent border-transparent shadow-none hover:bg-base-200/50",
    error: "bg-error/15 text-error border-error/30 hover:bg-error/25",
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
        "touch-target", // 确保触摸目标尺寸
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
