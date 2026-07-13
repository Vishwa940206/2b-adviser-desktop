"use client";

import { useCallback, useEffect, useState } from "react";

export type DesktopPermission = "default" | "granted" | "denied" | "unsupported";

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<DesktopPermission>("unsupported");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(window.Notification.permission as DesktopPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await window.Notification.requestPermission();
    setPermission(result as DesktopPermission);
  }, []);

  return { permission, requestPermission };
}
