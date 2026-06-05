// 画布区域通用外壳组件，提供标题栏、状态标签和占位/内容切换
import { DocumentIcon } from "@heroicons/react/24/outline";
import { type PropsWithChildren, type ReactNode } from "react";

// SectionShell 组件的属性接口
interface SectionShellProps {
  sectionTitle: string;
  sectionKey: "plan" | "render" | "compose";
  statusLabel: string;
  placeholder: boolean;
  placeholderText?: string;
  placeholderIcon?: ReactNode;
  children: ReactNode;
}

// 画布区域外壳组件：统一的标题栏、状态标签和占位符展示
export function SectionShell({
  sectionTitle,
  sectionKey,
  statusLabel,
  placeholder,
  placeholderText,
  placeholderIcon,
  children,
}: PropsWithChildren<SectionShellProps>) {
  const cardClass = sectionKey === "render" ? "card-comic" : "card-forge";
  return (
    <div className={`flex flex-col w-full ${cardClass}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-base-content/10 shrink-0 bg-base-200/60">
        <h2 className="text-sm font-heading font-bold m-0">{sectionTitle}</h2>
        <span className="badge badge-ghost badge-xs">{statusLabel}</span>
      </div>
      <div className="flex-1 p-3">
        {placeholder ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-2 opacity-40"
            data-testid="section-placeholder"
          >
            {placeholderIcon ?? <DocumentIcon className="w-8 h-8" />}
            <span className="text-xs">{placeholderText ?? "等待生成..."}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
