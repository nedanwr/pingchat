"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Gift, Plus, Smile, Sparkles, Sticker } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type ConversationMessage = {
  id: string;
  sender: string;
  time: string;
  content: string;
  avatarUrl: string;
};

interface ConversationPaneProps {
  sectionLabel?: string;
  title: ReactNode;
  headerAction?: ReactNode;
  messages: readonly ConversationMessage[];
  composerPlaceholder: string;
  onSendMessage?: (content: string) => Promise<void> | void;
  sendError?: string | null;
  scrollIdentity?: string;
  onLoadOlderMessages?: () => Promise<void> | void;
  canLoadOlderMessages?: boolean;
  isLoadingOlderMessages?: boolean;
}

const DEFAULT_MESSAGE_ROW_HEIGHT = 96;
const VIRTUALIZATION_OVERSCAN_PX = 600;

function avatarFallback(seed: string) {
  return seed.trim().charAt(0).toUpperCase() || "?";
}

function getMessageRowHeight(
  messageId: string,
  measuredHeights: Map<string, number>
) {
  return measuredHeights.get(messageId) ?? DEFAULT_MESSAGE_ROW_HEIGHT;
}

function findStartIndex(offsets: number[], rowHeights: number[], target: number) {
  if (offsets.length === 0) {
    return 0;
  }

  let low = 0;
  let high = offsets.length - 1;
  let answer = offsets.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const rowStart = offsets[mid] ?? 0;
    const rowHeight = rowHeights[mid] ?? DEFAULT_MESSAGE_ROW_HEIGHT;
    const rowEnd = rowStart + rowHeight;

    if (rowEnd >= target) {
      answer = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return answer;
}

function findEndIndex(offsets: number[], target: number) {
  if (offsets.length === 0) {
    return 0;
  }

  let low = 0;
  let high = offsets.length - 1;
  let answer = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const rowStart = offsets[mid] ?? 0;

    if (rowStart <= target) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return answer;
}

export function ConversationPane({
  sectionLabel,
  title,
  headerAction,
  messages,
  composerPlaceholder,
  onSendMessage,
  sendError,
  scrollIdentity,
  onLoadOlderMessages,
  canLoadOlderMessages = false,
  isLoadingOlderMessages = false
}: ConversationPaneProps) {
  const [composerValue, setComposerValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [heightVersion, setHeightVersion] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottomRef = useRef(false);
  const messageHeightsRef = useRef<Map<string, number>>(new Map());
  const loadOlderSnapshotRef = useRef<{
    pending: boolean;
    previousScrollHeight: number;
  }>({
    pending: false,
    previousScrollHeight: 0
  });

  const requestOlderMessages = useCallback(() => {
    if (
      !onLoadOlderMessages ||
      !canLoadOlderMessages ||
      isLoadingOlderMessages ||
      loadOlderSnapshotRef.current.pending
    ) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    loadOlderSnapshotRef.current = {
      pending: true,
      previousScrollHeight: viewport.scrollHeight
    };

    void onLoadOlderMessages();
  }, [canLoadOlderMessages, isLoadingOlderMessages, onLoadOlderMessages]);

  useEffect(() => {
    hasScrolledToBottomRef.current = false;
    loadOlderSnapshotRef.current.pending = false;
    messageHeightsRef.current = new Map();
    setHeightVersion(0);
  }, [scrollIdentity]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || hasScrolledToBottomRef.current || messages.length === 0) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
    hasScrolledToBottomRef.current = true;
  }, [messages.length, scrollIdentity]);

  useLayoutEffect(() => {
    if (isLoadingOlderMessages || !loadOlderSnapshotRef.current.pending) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      loadOlderSnapshotRef.current.pending = false;
      return;
    }

    const scrollHeightDelta =
      viewport.scrollHeight - loadOlderSnapshotRef.current.previousScrollHeight;
    viewport.scrollTop += scrollHeightDelta;
    loadOlderSnapshotRef.current.pending = false;
  }, [isLoadingOlderMessages, messages.length, heightVersion]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateViewportHeight = () => {
      setViewportHeight(viewport.clientHeight);
    };

    updateViewportHeight();
    const resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const topSentinel = topSentinelRef.current;

    if (!viewport || !topSentinel || !canLoadOlderMessages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        requestOlderMessages();
      },
      {
        root: viewport,
        rootMargin: "200px 0px 0px 0px",
        threshold: 0
      }
    );

    observer.observe(topSentinel);

    return () => {
      observer.disconnect();
    };
  }, [canLoadOlderMessages, requestOlderMessages]);

  const setMessageRowNode = useCallback(
    (messageId: string, node: HTMLDivElement | null) => {
      if (!node) {
        return;
      }

      const measuredHeight = node.offsetHeight;
      const previousHeight = messageHeightsRef.current.get(messageId);

      if (previousHeight === measuredHeight) {
        return;
      }

      messageHeightsRef.current.set(messageId, measuredHeight);
      setHeightVersion((currentVersion) => currentVersion + 1);
    },
    []
  );

  const { offsets, startIndex, endIndex, totalHeight } = useMemo(() => {
    const rowHeights = messages.map((message) =>
      getMessageRowHeight(message.id, messageHeightsRef.current)
    );

    const nextOffsets = new Array<number>(messages.length);
    let runningOffset = 0;

    for (let index = 0; index < messages.length; index += 1) {
      nextOffsets[index] = runningOffset;
      runningOffset += rowHeights[index] ?? DEFAULT_MESSAGE_ROW_HEIGHT;
    }

    if (messages.length === 0) {
      return {
        offsets: nextOffsets,
        startIndex: 0,
        endIndex: 0,
        totalHeight: 0
      };
    }

    const visibleTop = Math.max(scrollTop - VIRTUALIZATION_OVERSCAN_PX, 0);
    const visibleBottom =
      scrollTop + viewportHeight + VIRTUALIZATION_OVERSCAN_PX;

    const nextStartIndex = findStartIndex(nextOffsets, rowHeights, visibleTop);
    const nextEndIndex = Math.max(
      nextStartIndex,
      findEndIndex(nextOffsets, visibleBottom)
    );

    return {
      offsets: nextOffsets,
      startIndex: nextStartIndex,
      endIndex: nextEndIndex,
      totalHeight: runningOffset
    };
  }, [heightVersion, messages, scrollTop, viewportHeight]);

  const visibleMessages = useMemo(() => {
    if (messages.length === 0) {
      return [] as Array<{
        message: ConversationMessage;
        top: number;
      }>;
    }

    return messages.slice(startIndex, endIndex + 1).map((message, offsetIndex) => ({
      message,
      top: offsets[startIndex + offsetIndex] ?? 0
    }));
  }, [endIndex, messages, offsets, startIndex]);

  return (
    <section className="bg-background/20 flex min-w-0 flex-1 flex-col backdrop-blur-sm">
      <header className="border-border/50 bg-background/30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl">
        <div className="pl-2">
          {sectionLabel ? (
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {sectionLabel}
            </p>
          ) : null}
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        </div>
        {headerAction}
      </header>

      <div
        className="relative flex-1 overflow-y-auto p-4"
        onScroll={(event) => {
          const nextScrollTop = event.currentTarget.scrollTop;
          setScrollTop(nextScrollTop);

          if (nextScrollTop <= 64) {
            requestOlderMessages();
          }
        }}
        ref={viewportRef}
      >
        {isLoadingOlderMessages ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center">
            <p className="text-muted-foreground text-xs">Loading older messages...</p>
          </div>
        ) : null}

        <div
          className="relative"
          style={{
            height: Math.max(totalHeight, 1)
          }}
        >
          <div className="absolute top-0 h-px w-full" ref={topSentinelRef} />

          {visibleMessages.map(({ message, top }) => (
            <div
              className="absolute inset-x-0 pb-3"
              key={message.id}
              ref={(node) => {
                setMessageRowNode(message.id, node);
              }}
              style={{ top }}
            >
              <article className="flex gap-3 rounded-xl px-2 py-2">
                <Avatar className="border-border/60 bg-background/40 size-10 shrink-0 border">
                  <AvatarImage
                    alt={`${message.sender} profile picture`}
                    src={message.avatarUrl}
                  />
                  <AvatarFallback>{avatarFallback(message.sender)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold">{message.sender}</p>
                    <p className="text-muted-foreground text-xs">{message.time}</p>
                  </div>
                  <p className="text-foreground/90 pt-0.5 text-sm">
                    {message.content}
                  </p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <form
        className="border-border/50 bg-background/30 border-t px-3 backdrop-blur-xl sm:px-4"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!onSendMessage || isSubmitting) {
            return;
          }

          const trimmedContent = composerValue.trim();
          if (!trimmedContent) {
            return;
          }

          setIsSubmitting(true);
          try {
            await onSendMessage(trimmedContent);
            setComposerValue("");
          } catch {
            // Parent surface handles displaying send errors.
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="flex h-16 items-center gap-1">
          <Button
            className="text-muted-foreground hover:text-foreground hover:bg-accent/70 size-8 rounded-xl sm:size-9"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Plus className="size-5" strokeWidth={2.75} />
            <span className="sr-only">More actions</span>
          </Button>
          <Input
            className="text-foreground placeholder:text-muted-foreground/90 h-full min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm focus-visible:border-transparent focus-visible:ring-0 sm:px-3 sm:text-base dark:bg-transparent"
            id="composer"
            onChange={(event) => {
              setComposerValue(event.target.value);
            }}
            placeholder={composerPlaceholder}
            value={composerValue}
          />
          <div className="flex items-center justify-end gap-1 pl-2">
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 size-8 rounded-xl sm:size-9"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Gift />
              <span className="sr-only">Gift</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 h-8 rounded-xl px-2 text-[10px] font-semibold tracking-wide sm:h-9 sm:px-2.5 sm:text-xs"
              size="sm"
              type="button"
              variant="ghost"
            >
              GIF
              <span className="sr-only">Open GIF picker</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl sm:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Sticker />
              <span className="sr-only">Stickers</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl md:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Smile />
              <span className="sr-only">Emoji</span>
            </Button>
            <Button
              className="text-muted-foreground hover:text-foreground hover:bg-accent/70 hidden size-9 rounded-xl lg:inline-flex"
              size="icon"
              type="button"
              variant="ghost"
            >
              <Sparkles />
              <span className="sr-only">Effects</span>
            </Button>
          </div>
        </div>
        {sendError ? (
          <p className="text-destructive pb-2 text-xs">{sendError}</p>
        ) : null}
      </form>
    </section>
  );
}
