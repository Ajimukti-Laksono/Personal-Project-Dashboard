import { EventEmitter } from "events";

export type RealtimeEventType =
  | "commit.new"
  | "pr.updated"
  | "issue.updated"
  | "workflow.updated"
  | "repo.updated"
  | "activity.new";

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  data: T;
  timestamp: string;
}

declare global {
  var __realtimeEmitter: EventEmitter | undefined;
}

/**
 * Singleton EventEmitter on globalThis to persist through Next.js hot module reloading.
 */
export const realtimeEmitter: EventEmitter = globalThis.__realtimeEmitter ?? new EventEmitter();

// Support multiple SSE client connections without warning
realtimeEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalThis.__realtimeEmitter = realtimeEmitter;
}

/**
 * Broadcasts an event to all connected SSE clients.
 */
export function broadcast<T = unknown>(type: RealtimeEventType, data: T): void {
  const event: RealtimeEvent<T> = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit("event", event);
}

/**
 * Subscribes a listener to realtime events. Returns an unsubscribe function.
 */
export function subscribe(listener: (event: RealtimeEvent) => void): () => void {
  realtimeEmitter.on("event", listener);
  return () => {
    realtimeEmitter.off("event", listener);
  };
}
