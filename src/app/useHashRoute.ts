import { useCallback, useEffect, useState } from "react";
import type { Route } from "./context";

const ROUTES: Route[] = ["today", "review", "learn", "kana", "settings"];

function read(): Route {
  const r = window.location.hash.replace(/^#\/?/, "") as Route;
  return ROUTES.includes(r) ? r : "today";
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = useCallback((r: Route) => {
    window.location.hash = `/${r}`;
    window.scrollTo({ top: 0 });
  }, []);
  return [route, navigate];
}
