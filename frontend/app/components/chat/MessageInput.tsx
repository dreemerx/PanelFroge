// 消息输入组件，提供文本输入框和发送按钮
import { Button } from "~/components/ui/Button";

// MessageInput 组件的属性接口
interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

// 消息输入组件：支持 Enter 发送、Shift+Enter 换行
export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        className="input input-bordered bg-base-300 flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
      />
      <Button onClick={onSend} disabled={disabled || !value.trim()}>
        发送
      </Button>
    </div>
  );
}
