"use client";
import { useEffect } from "react";

/** Success page: remember this browser ordered, so the install card may show next. */
export default function MarkOrdered() {
  useEffect(() => {
    try {
      localStorage.setItem("sv_ordered", "1");
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
