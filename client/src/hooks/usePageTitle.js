import { useEffect } from "react";

const IS_DEV = import.meta.env.DEV;

/**
 * Sets document.title for the current page.
 * In development mode, appends " (DEV)" to the title.
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = IS_DEV ? `${title} (DEV)` : title;
  }, [title]);
}
