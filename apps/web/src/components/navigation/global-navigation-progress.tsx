"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useNavigationProgressStore } from "~/stores/navigation-progress-store";

export function GlobalNavigationProgress() {
  const pathname = usePathname();
  const progress = useNavigationProgressStore((state) => state.progress);
  const visible = useNavigationProgressStore((state) => state.visible);
  const settleNavigation = useNavigationProgressStore(
    (state) => state.settleNavigation
  );

  useEffect(() => {
    settleNavigation();
  }, [pathname, settleNavigation]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="bg-primary h-full w-full origin-left transition-transform duration-180 ease-out"
        style={{
          transform: `scaleX(${Math.max(progress, 0)})`
        }}
      />
    </div>
  );
}
