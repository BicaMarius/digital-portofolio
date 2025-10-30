import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Use undefined initially, then set actual value after mount
  // This prevents rendering issues on mobile
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return false during SSR/initial render to avoid issues
  if (!mounted) return false;
  return isMobile ?? false;
}
