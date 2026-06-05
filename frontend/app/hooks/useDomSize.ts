// DOM 元素尺寸追踪 Hook，通过 ResizeObserver 实时同步 Shape 尺寸到编辑器
import { useCallback, useLayoutEffect, useRef } from "react";
import { AtomMap, EditorAtom, type Editor, type TLShape, type TLShapeId } from "tldraw";

const ShapeSizes = new EditorAtom("shape-sizes", (editor: Editor) => {
  const map = new AtomMap<TLShapeId, { width: number; height: number }>("shape-sizes");
  editor.sideEffects.registerAfterDeleteHandler("shape", (shape) => {
    map.delete(shape.id);
  });
  return map;
});

// 获取指定 Shape 的缓存尺寸（宽高），未缓存时返回 undefined
export function getShapeSize(editor: Editor, shapeId: TLShapeId) {
  return ShapeSizes.get(editor).get(shapeId);
}

// 追踪 DOM 元素尺寸并同步到 tldraw 编辑器，返回需要挂载的 ref
export function useDomSize(shape: TLShape, editor: Editor | null) {
  const ref = useRef<HTMLDivElement>(null);

  const updateSize = useCallback(() => {
    if (!ref.current || !editor) return;
    const width = ref.current.offsetWidth;
    const height = ref.current.offsetHeight;
    if (height <= 0) return;
    ShapeSizes.update(editor, (map) => {
      const existing = map.get(shape.id);
      if (existing && existing.width === width && existing.height === height) return map;
      return map.set(shape.id, { width, height });
    });
  }, [editor, shape.id]);

  useLayoutEffect(() => {
    updateSize();
  }, [updateSize]);

  useLayoutEffect(() => {
    if (!ref.current || !editor) return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [updateSize]);

  return ref;
}
