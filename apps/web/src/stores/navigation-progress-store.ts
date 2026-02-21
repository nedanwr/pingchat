"use client";

import { create } from "zustand";

const SHOW_DELAY_MS = 120;
const MIN_VISIBLE_MS = 200;
const COMPLETE_HOLD_MS = 140;
const FAILSAFE_TIMEOUT_MS = 15_000;
const TRICKLE_INTERVAL_MS = 140;

type NavigationProgressState = {
  pendingCount: number;
  progress: number;
  visible: boolean;
  visibleAt: number | null;
  beginNavigation: () => void;
  settleNavigation: () => void;
};

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let failSafeTimer: ReturnType<typeof setTimeout> | null = null;
let trickleTimer: ReturnType<typeof setInterval> | null = null;

function clearShowTimer() {
  if (showTimer === null) {
    return;
  }
  clearTimeout(showTimer);
  showTimer = null;
}

function clearHideTimer() {
  if (hideTimer === null) {
    return;
  }
  clearTimeout(hideTimer);
  hideTimer = null;
}

function clearFailSafeTimer() {
  if (failSafeTimer === null) {
    return;
  }
  clearTimeout(failSafeTimer);
  failSafeTimer = null;
}

function stopTrickle() {
  if (trickleTimer === null) {
    return;
  }
  clearInterval(trickleTimer);
  trickleTimer = null;
}

export const useNavigationProgressStore = create<NavigationProgressState>(
  (set, get) => ({
    pendingCount: 0,
    progress: 0,
    visible: false,
    visibleAt: null,

    beginNavigation: () => {
      const nextPendingCount = get().pendingCount + 1;
      set({ pendingCount: nextPendingCount });

      if (nextPendingCount !== 1) {
        return;
      }

      clearHideTimer();
      clearShowTimer();
      clearFailSafeTimer();
      stopTrickle();

      showTimer = setTimeout(() => {
        if (get().pendingCount <= 0) {
          return;
        }

        set({
          progress: 0.12,
          visible: true,
          visibleAt: Date.now()
        });

        stopTrickle();
        trickleTimer = setInterval(() => {
          set((state) => ({
            progress:
              state.progress >= 0.9
                ? state.progress
                : Math.min(state.progress + (1 - state.progress) * 0.14, 0.9)
          }));
        }, TRICKLE_INTERVAL_MS);
      }, SHOW_DELAY_MS);

      failSafeTimer = setTimeout(() => {
        get().settleNavigation();
      }, FAILSAFE_TIMEOUT_MS);
    },

    settleNavigation: () => {
      clearShowTimer();
      clearFailSafeTimer();
      stopTrickle();

      const state = get();
      if (!state.visible) {
        set({
          pendingCount: 0,
          progress: 0,
          visibleAt: null
        });
        return;
      }

      set({
        pendingCount: 0,
        progress: 1
      });

      clearHideTimer();
      const elapsedVisibleMs =
        state.visibleAt === null ? 0 : Date.now() - state.visibleAt;
      const hideDelayMs =
        Math.max(MIN_VISIBLE_MS - elapsedVisibleMs, 0) + COMPLETE_HOLD_MS;

      hideTimer = setTimeout(() => {
        set({
          progress: 0,
          visible: false,
          visibleAt: null
        });
        hideTimer = null;
      }, hideDelayMs);
    }
  })
);
