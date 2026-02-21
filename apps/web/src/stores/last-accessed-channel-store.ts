"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LastAccessedChannelState = {
  lastChannelByGuildId: Record<string, string>;
  setLastAccessedChannel: (guildId: string, channelId: string) => void;
};

export const useLastAccessedChannelStore = create<LastAccessedChannelState>()(
  persist(
    (set) => ({
      lastChannelByGuildId: {},
      setLastAccessedChannel: (guildId, channelId) => {
        set((state) => {
          if (state.lastChannelByGuildId[guildId] === channelId) {
            return state;
          }
          return {
            lastChannelByGuildId: {
              ...state.lastChannelByGuildId,
              [guildId]: channelId
            }
          };
        });
      }
    }),
    {
      name: "lastAccessedChannels",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
