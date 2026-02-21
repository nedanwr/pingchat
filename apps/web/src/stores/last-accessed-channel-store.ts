"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type LastAccessedChannelState = {
  lastChannelByGuildId: Record<string, string>;
  setLastAccessedChannel: (guildId: string, channelId: string) => void;
  seedLastAccessedChannels: (
    channelsByGuildId: Record<string, string>
  ) => void;
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
      },
      seedLastAccessedChannels: (channelsByGuildId) => {
        set((state) => {
          let nextChannelsByGuildId = state.lastChannelByGuildId;
          let changed = false;

          for (const [guildId, channelId] of Object.entries(channelsByGuildId)) {
            if (nextChannelsByGuildId[guildId]) {
              continue;
            }
            if (!changed) {
              nextChannelsByGuildId = { ...nextChannelsByGuildId };
              changed = true;
            }
            nextChannelsByGuildId[guildId] = channelId;
          }

          if (!changed) {
            return state;
          }

          return {
            lastChannelByGuildId: nextChannelsByGuildId
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
