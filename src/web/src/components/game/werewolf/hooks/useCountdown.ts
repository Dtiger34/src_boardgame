import { useState, useEffect } from 'react';

export function useCountdown(phaseEndsAt: number): number {
  const [secs, setSecs] = useState(() => Math.max(0, Math.round((phaseEndsAt - Date.now()) / 1000)));
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.round((phaseEndsAt - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [phaseEndsAt]);
  return secs;
}
