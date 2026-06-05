// 通用弹窗组件，支持标题、内容和操作按钮，具备焦点陷阱和 Esc 关闭
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";

// Modal 组件的属性接口
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

// 通用弹窗组件：焦点管理、键盘事件处理和无障碍支持
export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open" aria-modal="true" role="dialog" aria-labelledby={title ? "modal-title" : undefined}>
      <div
        ref={modalRef}
        className="modal-box bg-base-200 border border-base-300/40 rounded-2xl shadow-glass"
        tabIndex={-1}
      >
        {title && (
          <h3 id="modal-title" className="font-heading font-bold text-lg mb-4">
            {title}
          </h3>
        )}
        <div className="py-4">{children}</div>
        <div className="modal-action gap-2">
          {actions}
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="关闭对话框">关闭</button>
      </form>
    </dialog>
  );
}
