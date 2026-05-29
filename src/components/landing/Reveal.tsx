'use client';

/**
 * Scroll-reveal wrapper. Children start slightly down + transparent and slide
 * into place when scrolled into view (IntersectionObserver). Mirrors the
 * [data-reveal] behavior from the original design. Respects reduced-motion
 * via the .reveal-init CSS.
 */

import { useEffect, useRef, useState } from 'react';

export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setShown(true), delay * 90);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    // Safety net: ensure visible even if observer never fires.
    const t = setTimeout(() => setShown(true), 800);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal-init ${shown ? 'revealed' : ''} ${className}`}>
      {children}
    </div>
  );
}
