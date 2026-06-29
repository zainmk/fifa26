"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function RefreshLive() {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return null;
}
