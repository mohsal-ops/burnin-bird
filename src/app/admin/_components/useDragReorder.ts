"use client";

import { useEffect, useRef, useState } from "react";

// Grab-and-drop reordering that works with a mouse AND a finger (pointer
// events, not HTML5 drag - that one doesn't work on phones). While dragging,
// the list shows the new order live; the change is committed once, on release.
//
// Usage: const d = useDragReorder("featured", items, save);
//   render d.items; on each item: data-reorder={group} data-reorder-index={i}
//   and on its grab area: onPointerDown={d.grab(i)} + className "touch-none".
export function useDragReorder<T>(group: string, items: T[], onCommit: (next: T[]) => void) {
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const live = useRef(drag);
  live.current = drag;
  const commit = useRef(onCommit);
  commit.current = onCommit;
  const source = useRef(items);
  source.current = items;
  const active = drag !== null;

  useEffect(() => {
    if (!active) return;
    const move = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(`[data-reorder="${group}"]`);
      const over = el ? Number(el.getAttribute("data-reorder-index")) : NaN;
      const d = live.current;
      if (d && !Number.isNaN(over) && over !== d.over) setDrag({ from: d.from, over });
    };
    const end = () => {
      const d = live.current;
      setDrag(null);
      if (d && d.from !== d.over) commit.current(moveItem(source.current, d.from, d.over));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [active, group]);

  const grab = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setDrag({ from: i, over: i });
  };

  return {
    items: drag ? moveItem(items, drag.from, drag.over) : items,
    /** index (in the displayed list) of the item being dragged, or null */
    dragging: drag ? drag.over : null,
    grab,
  };
}

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
