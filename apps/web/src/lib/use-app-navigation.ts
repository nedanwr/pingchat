"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import { useNavigationProgressStore } from "~/stores/navigation-progress-store";

function stripQueryAndHash(href: string) {
  const [pathOnly] = href.split(/[?#]/, 1);
  return pathOnly ?? href;
}

export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const beginNavigation = useNavigationProgressStore(
    (state) => state.beginNavigation
  );

  const shouldTrackNavigation = useCallback(
    (href: string) => stripQueryAndHash(href) !== pathname,
    [pathname]
  );

  const push = useCallback(
    (href: string) => {
      if (shouldTrackNavigation(href)) {
        beginNavigation();
      }
      router.push(href);
    },
    [beginNavigation, router, shouldTrackNavigation]
  );

  const replace = useCallback(
    (href: string) => {
      if (shouldTrackNavigation(href)) {
        beginNavigation();
      }
      router.replace(href);
    },
    [beginNavigation, router, shouldTrackNavigation]
  );

  return {
    prefetch: router.prefetch,
    push,
    replace
  };
}
