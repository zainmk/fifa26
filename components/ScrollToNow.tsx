"use client";

import { useEffect } from "react";

export function ScrollToNow() {
  useEffect(() => {
    const el = document.getElementById("now");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);

  return null;
}
