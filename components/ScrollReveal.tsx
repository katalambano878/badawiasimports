'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'scale';

const directionClass: Record<Direction, string> = {
  up: 'scroll-animate',
  left: 'scroll-animate-left',
  right: 'scroll-animate-right',
  scale: 'scroll-animate-scale',
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  rootMargin?: string;
  /** Delay before reveal animation starts, in seconds */
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  rootMargin = '0px 0px -40px 0px',
  delay = 0,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation({ rootMargin, triggerOnce: true });
  const animateClass = directionClass[direction];
  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={`${animateClass} ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
