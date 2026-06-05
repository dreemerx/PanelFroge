// 画布事件总线定义，用于 canvas 组件间的解耦通信
import type { ShotUpdatePayload } from "~/types";

// 画布 shape 操作的名称类型
export type ShapeActionName = "add-to-assets" | "approve" | "edit" | "history" | "regenerate";

// shape 操作的载荷数据结构
export interface ShapeActionPayload {
  shapeId: string;
  action: ShapeActionName;
  entityType: "character" | "shot";
  entityId: number;
  feedbackType: "render";
  shotPatch?: ShotUpdatePayload;
  feedbackContent?: string;
}

// 画布事件类型映射
export interface CanvasEvents {
  "preview-image": { src: string; alt: string };
  "preview-video": { src: string; title: string };
  "shape-action": ShapeActionPayload;
  "version-history": { entityType: "character" | "shot"; entityId: number };
}

type EventCallback<T> = (data: T) => void;
type AnyEventCallback = (data: CanvasEvents[keyof CanvasEvents]) => void;

// 画布事件总线单例类，支持事件的订阅、发布和取消
class CanvasEventBus {
  private listeners: Partial<Record<keyof CanvasEvents, Set<AnyEventCallback>>> = {};

  on<K extends keyof CanvasEvents>(
    event: K,
    callback: EventCallback<CanvasEvents[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(callback as EventCallback<CanvasEvents[keyof CanvasEvents]>);

    // 返回取消订阅函数
    return () => {
      this.listeners[event]?.delete(callback as EventCallback<CanvasEvents[keyof CanvasEvents]>);
    };
  }

  emit<K extends keyof CanvasEvents>(event: K, data: CanvasEvents[K]): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }

  off<K extends keyof CanvasEvents>(
    event: K,
    callback?: EventCallback<CanvasEvents[K]>
  ): void {
    if (callback) {
      this.listeners[event]?.delete(callback as EventCallback<CanvasEvents[keyof CanvasEvents]>);
    } else {
      delete this.listeners[event];
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

export const canvasEvents = new CanvasEventBus();
