import { describe, it, expect } from "vitest";
import { broadcast, subscribe, RealtimeEvent } from "@/lib/realtime";

describe("Realtime SSE Emitter", () => {
  it("should broadcast events to active subscribers", () => {
    const received: RealtimeEvent[] = [];
    const unsubscribe = subscribe((event) => {
      received.push(event);
    });

    broadcast("commit.new", { sha: "abc", message: "test commit" });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe("commit.new");
    expect(received[0].data).toEqual({ sha: "abc", message: "test commit" });

    unsubscribe();
  });

  it("should stop receiving events after unsubscribe (prevent memory leaks)", () => {
    const received: RealtimeEvent[] = [];
    const unsubscribe = subscribe((event) => {
      received.push(event);
    });

    broadcast("pr.updated", { number: 1 });
    expect(received).toHaveLength(1);

    // Unsubscribe
    unsubscribe();

    // Broadcast again
    broadcast("pr.updated", { number: 2 });
    expect(received).toHaveLength(1); // Still 1, not 2
  });

  it("should support multiple concurrent listeners", () => {
    const received1: RealtimeEvent[] = [];
    const received2: RealtimeEvent[] = [];

    const unsub1 = subscribe((e) => received1.push(e));
    const unsub2 = subscribe((e) => received2.push(e));

    broadcast("issue.updated", { number: 42 });

    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);

    unsub1();
    unsub2();
  });
});
