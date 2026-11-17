import { ROUTES } from "./routes";

/** Pages in the order they appear in the top menu (the logo, home, comes first). */
const ORDER = ["home", "product", "solutions", "workflow", "pricing", "developers", "method"] as const;

/** Path → position in the menu, for both languages. */
export const NAV_ORDER: Record<string, number> = Object.fromEntries(
  ORDER.flatMap((id, i) => [[ROUTES[id].en, i], [ROUTES[id].tr, i]]),
);

/**
 * Runs in <head> before the first paint. It remembers the page you are leaving and, when the next
 * page is revealed, tags the view transition "forward" or "back" by comparing the two pages' places
 * in the menu. CSS in globals.css turns those tags into a left or right slide. Same page in the
 * other language, or a page outside the menu, keeps the browser's default cross-fade.
 */
export const NAV_TRANSITION_SCRIPT = `(() => {
  const order = ${JSON.stringify(NAV_ORDER)};
  const norm = (p) => (p.length > 1 ? p.replace(/\\/$/, "") : p);
  const key = "quovra:lastPath";
  addEventListener("pagehide", () => { try { sessionStorage.setItem(key, norm(location.pathname)); } catch {} });
  addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) return;
    let from = null;
    try { from = sessionStorage.getItem(key); } catch {}
    const a = from == null ? undefined : order[from];
    const b = order[norm(location.pathname)];
    if (a === undefined || b === undefined || a === b) return;
    e.viewTransition.types.add(b > a ? "forward" : "back");
  });
})();`;
