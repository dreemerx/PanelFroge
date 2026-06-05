// 悬浮操作栏组件，在鼠标悬停时显示操作按钮组
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";

// 操作按钮变体类型
type ActionVariant = "primary" | "secondary" | "accent" | "ghost" | "error";

// 支持 heroicons 风格的图标组件
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

// 操作项接口，定义按钮的图标、标签和点击行为
export interface ActionItem {
  icon: IconComponent;
  label: string;
  onClick: () => void;
  variant?: ActionVariant;
  loading?: boolean;
}

// HoverActionBar 组件的属性接口
interface HoverActionBarProps {
  actions: ActionItem[];
  children: React.ReactNode;
  className?: string;
}

// 悬浮操作栏组件：包裹子元素，悬停时显示操作按钮
export function HoverActionBar({
  actions,
  children,
  className,
}: HoverActionBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${className || ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className={`absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-base-100/90 p-1 transition-all duration-200 ${
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {actions.map((action, index) => {
          const btnColor =
            action.variant === "error"
              ? "btn-error"
              : `btn-${action.variant || "ghost"}`;

          const Icon = action.icon;

          return (
            <div key={index} className="tooltip" data-tip={action.label}>
              <button
                className={`btn btn-xs btn-circle ${btnColor} ${
                  action.loading ? "loading" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  action.onClick();
                }}
                disabled={action.loading}
                aria-label={action.label}
              >
                {!action.loading && <Icon className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
