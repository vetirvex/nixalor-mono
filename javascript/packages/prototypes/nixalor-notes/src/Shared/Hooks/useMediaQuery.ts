import { useCallback, useSyncExternalStore } from "react";

/** Phone layout. Keep in sync with the `(max-width: 720px)` media queries in CSS. */
const MOBILE_QUERY = "(max-width: 720px)";

/** Narrow enough that the note outline overlays the text instead of sitting beside it. */
const NARROW_QUERY = "(max-width: 1100px)";

const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
};

export { MOBILE_QUERY, NARROW_QUERY, useMediaQuery };
