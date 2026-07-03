import { useState, useEffect, useRef, useCallback } from 'react';

export function useAutoScroll() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.03);
  const [hasFinished, setHasFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScroll = useCallback(() => {
    setIsScrolling(true);
    setHasFinished(false);
  }, []);

  const pauseScroll = useCallback(() => setIsScrolling(false), []);

  const resetScroll = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setHasFinished(false);
      setIsScrolling(true);
    }
  }, []);

  useEffect(() => {
    if (!isScrolling || !containerRef.current) return;

    let animationId: number;
    let lastTime = performance.now();

    const smoothScroll = (time: number) => {
      if (!containerRef.current) return;
      const delta = time - lastTime;
      lastTime = time;
      containerRef.current.scrollTop += scrollSpeed * delta;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 3) {
        setIsScrolling(false);
        setHasFinished(true);
        return;
      }
      animationId = requestAnimationFrame(smoothScroll);
    };

    animationId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, scrollSpeed]);

  return {
    containerRef,
    isScrolling,
    hasFinished,
    scrollSpeed,
    setScrollSpeed,
    startScroll,
    pauseScroll,
    resetScroll,
    setIsScrolling,
  };
}
