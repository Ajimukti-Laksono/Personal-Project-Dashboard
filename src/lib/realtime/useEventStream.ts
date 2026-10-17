"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeEventType } from "./index";

export type ConnectionStatus = "Live" | "Reconnecting" | "Offline";

export interface EventStreamOptions {
  url?: string;
  onEvent?: (eventType: RealtimeEventType, data: unknown) => void;
  onReconnect?: () => void;
}

/**
 * Custom React hook for consuming Server-Sent Events (SSE) with:
 * - Auto-reconnection with exponential backoff
 * - Connection status tracking (Live / Reconnecting / Offline)
 * - Automatic refetch trigger on reconnect
 */
export function useEventStream(options: EventStreamOptions = {}) {
  const { url = "/api/events", onEvent, onReconnect } = options;

  const [status, setStatus] = useState<ConnectionStatus>("Offline");
  const [lastEvent, setLastEvent] = useState<{ type: string; data: unknown } | null>(null);
  const [connectTrigger, setConnectTrigger] = useState(0);

  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
  }, [onEvent, onReconnect]);

  const reconnect = useCallback(() => {
    setConnectTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    let wasConnected = false;

    function setupStream() {
      if (!isMounted) return;

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      try {
        const es = new EventSource(url);
        eventSource = es;

        es.onopen = () => {
          if (!isMounted) return;
          setStatus("Live");

          if (wasConnected && onReconnectRef.current) {
            onReconnectRef.current();
          }

          wasConnected = true;
          retryCount = 0;
        };

        const eventTypes: RealtimeEventType[] = [
          "commit.new",
          "pr.updated",
          "issue.updated",
          "workflow.updated",
          "repo.updated",
          "activity.new",
        ];

        for (const type of eventTypes) {
          es.addEventListener(type, (event: MessageEvent) => {
            if (!isMounted) return;
            try {
              const data = JSON.parse(event.data);
              setLastEvent({ type, data });
              if (onEventRef.current) {
                onEventRef.current(type, data);
              }
            } catch (err) {
              console.error(`Failed to parse SSE payload for ${type}:`, err);
            }
          });
        }

        es.onerror = () => {
          if (!isMounted) return;
          es.close();
          eventSource = null;

          setStatus("Reconnecting");
          retryCount += 1;

          // Exponential backoff: 1s, 2s, 4s, 8s, up to 30s
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);

          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }

          reconnectTimeout = setTimeout(setupStream, delay);
        };
      } catch {
        // EventSource creation failed
      }
    }

    setupStream();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [url, connectTrigger]);

  return {
    status,
    lastEvent,
    reconnect,
  };
}
