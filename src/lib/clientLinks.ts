import type { NavigateFunction } from "react-router-dom";

// Pages rendered from dangerouslySetInnerHTML can't use <Link>, so they ship
// plain <a href="/..."> markup. This delegator turns clicks on those internal
// links into client-side react-router navigations so the page doesn't reload.
export function attachInternalLinkNav(
  root: HTMLElement,
  navigate: NavigateFunction,
): () => void {
  const handler = (ev: MouseEvent) => {
    if (ev.defaultPrevented) return;
    if (ev.button !== 0) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const anchor = (ev.target as HTMLElement | null)?.closest("a");
    if (!anchor) return;
    if (anchor.target && anchor.target !== "_self") return;
    const href = anchor.getAttribute("href") || "";
    if (!href.startsWith("/")) return;
    ev.preventDefault();
    navigate(href);
  };
  root.addEventListener("click", handler);
  return () => root.removeEventListener("click", handler);
}
