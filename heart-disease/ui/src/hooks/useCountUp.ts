import { useState, useEffect } from 'react';

export function useCountUp(target: number, durationMs = 1400, delayMs = 400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId: number;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafId); };
  }, [target, durationMs, delayMs]);
  return value;
}
