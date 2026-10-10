"use client";

import { createContext, forwardRef, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

type NavigationState = { pathname: string; changed: boolean };
type NavigationContext = NavigationState & { navigate: (href: string) => boolean };
const Navigation = createContext<NavigationContext | null>(null);

// Only public listening pages can be switched in the persistent player shell.
// Studio and authentication routes always use a real document navigation.
export function publicRoute(pathname: string) {
  if (pathname === "/") return { kind: "listen" as const, title: "NorthStar — Official Music" };
  if (pathname === "/discography") return { kind: "discography" as const, title: "Discography · NorthStar" };
  if (pathname === "/privacy") return { kind: "privacy" as const, title: "Listening privacy · NorthStar" };
  const release = pathname.match(/^\/release\/([a-zA-Z0-9_-]+)$/);
  if (release) return { kind: "release" as const, id: release[1], title: "Release · NorthStar" };
  const song = pathname.match(/^\/song\/([a-zA-Z0-9_-]+)$/);
  if (song) return { kind: "song" as const, id: song[1], title: "Song · NorthStar" };
  return null;
}

export function NavigationProvider({ initialPath, children }: { initialPath: string; children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({ pathname: initialPath, changed: false });
  const enabled = !!publicRoute(initialPath);

  function show(pathname: string) {
    setState({ pathname, changed: true });
    document.title = publicRoute(pathname)?.title ?? document.title;
  }

  useEffect(() => {
    if (!enabled) return;
    function onBackOrForward() {
      const pathname = window.location.pathname;
      if (publicRoute(pathname)) show(pathname);
      else window.location.reload();
    }
    window.addEventListener("popstate", onBackOrForward);
    return () => window.removeEventListener("popstate", onBackOrForward);
  }, [enabled]);

  function navigate(href: string) {
    if (!enabled) return false;
    try {
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin || !publicRoute(target.pathname)) return false;
      if (target.href !== window.location.href) {
        window.history.pushState({ ...window.history.state, northstar: true }, "", target.href);
      }
      show(target.pathname);
      window.scrollTo({ top: 0, behavior: "instant" });
      return true;
    } catch {
      // Keep the native anchor working if browser navigation is unavailable.
      return false;
    }
  }

  return <Navigation.Provider value={{ ...state, navigate }}>{children}</Navigation.Provider>;
}

export function useNavigation() {
  const navigation = useContext(Navigation);
  if (!navigation) throw new Error("NorthStar navigation is unavailable.");
  return navigation;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, onClick, target, children, ...props }, ref) {
  const navigation = useContext(Navigation);
  // Creator routes may initiate ChatGPT sign-in, which must leave an iframe.
  const resolvedTarget = target ?? (href.startsWith("/studio") ? "_top" : undefined);
  return <a {...props} ref={ref} href={href} target={resolvedTarget} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.download !== undefined || (resolvedTarget && resolvedTarget !== "_self")) return;
    if (navigation?.navigate(href)) event.preventDefault();
  }}>{children}</a>;
});
export default Link;
