import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { NAV_ORDER, NAV_TRANSITION_SCRIPT } from "@/lib/navTransition";

/** Runs the head script in a fake window: leave `from`, reveal `to`, return the transition types added. */
function navigate(from: string, to: string | null, transition = true): string[] {
  const store = new Map<string, string>();
  const listeners: Record<string, (e: unknown) => void> = {};
  const types = new Set<string>();
  const win = {
    location: { pathname: from },
    sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
    addEventListener: (name: string, fn: (e: unknown) => void) => (listeners[name] = fn),
  };
  runInNewContext(NAV_TRANSITION_SCRIPT, win);
  listeners.pagehide({});
  if (to !== null) win.location.pathname = to;
  listeners.pagereveal({ viewTransition: transition ? { types } : null });
  return [...types];
}

describe("page transition direction", () => {
  it("follows the menu order in both languages", () => {
    expect(NAV_ORDER["/tr/urun"]).toBeLessThan(NAV_ORDER["/tr/fiyatlar"]);
    expect(NAV_ORDER["/product"]).toBe(NAV_ORDER["/tr/urun"]);
  });

  it("slides forward to pages further right and back to pages further left", () => {
    expect(navigate("/tr/urun", "/tr/fiyatlar")).toEqual(["forward"]);
    expect(navigate("/pricing", "/product")).toEqual(["back"]);
    expect(navigate("/", "/methodology/")).toEqual(["forward"]);
  });

  it("keeps the default fade for language switches, reloads and pages outside the menu", () => {
    expect(navigate("/pricing", "/tr/fiyatlar")).toEqual([]);
    expect(navigate("/pricing", "/pricing")).toEqual([]);
    expect(navigate("/pricing", "/guide")).toEqual([]);
  });

  it("does nothing when the browser runs no transition", () => {
    expect(navigate("/product", "/pricing", false)).toEqual([]);
  });
});
