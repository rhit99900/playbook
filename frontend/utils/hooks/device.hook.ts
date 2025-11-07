import { useCallback, useEffect, useState } from "react";

const useIsMobile = (mobileScreenSize = 768) => {
  try {
    if(window && typeof window?.matchMedia !== 'function') {
      throw Error('matchMedia is not supported by the browser');
    }
  } catch(e: any) {
    console.warn(e?.message)
  }

  const [ isMobile, setIsMobile ] = useState<boolean>(false);

  const checkIsMobile = useCallback((event: MediaQueryListEvent) => {
    setIsMobile(event.matches);
  }, []);

  useEffect(() => {
    const mediaListener = window.matchMedia(`(max-width): ${mobileScreenSize}px`);
    try {
      mediaListener.addEventListener('change', checkIsMobile);
    } catch {
      mediaListener.addListener(checkIsMobile);
    }

    return () => {
      try {
        mediaListener.removeEventListener('change', checkIsMobile);
      } catch {
        mediaListener.removeListener(checkIsMobile);
      }
    }
  }, [mobileScreenSize])

  return isMobile;
}


export default useIsMobile;