"use client";

import { useEffect, useRef, useState } from "react";
import "./animatedDigit.css";

interface AnimatedDigitProps {
  prevValue: number;
  value: number;
  duration?: number;
}

export default function AnimatedDigit({ prevValue, value, duration = 2000 }: AnimatedDigitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [digitSequence, setDigitSequence] = useState<string[]>([]);

  useEffect(() => {
    if (prevValue === value) {
      setDigitSequence([value.toString()]);
      setIsAnimating(false);
      return;
    }

    // Create a stopwatch-like sequence
    const from = prevValue;
    const to = value;
    const sequence: string[] = [];
    let current = from;

    // Add starting value
    sequence.push(current.toString());

    // Create continuous sequence like a stopwatch
    while (current !== to) {
      current = (current + 1) % 10;
      sequence.push(current.toString());
    }

    // Add some extra rotations for more dramatic effect
    const extraRotations = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < extraRotations; i++) {
      for (let j = 0; j < 10; j++) {
        sequence.push(j.toString());
      }
    }

    // Finally add the target value
    sequence.push(to.toString());

    setDigitSequence(sequence);
    setIsAnimating(true);

    // Reset position
    if (containerRef.current) {
      containerRef.current.style.transition = "none";
      containerRef.current.style.transform = "translateY(0%)";
    }

    // Start animation
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        containerRef.current.style.transform = `translateY(-${(sequence.length - 1) * 100}%)`;
      }
    });

    // Reset after animation
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = "none";
        containerRef.current.style.transform = "translateY(0%)";
      }
      setDigitSequence([value.toString()]);
      setIsAnimating(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [prevValue, value, duration]);

  return (
    <div className={`digit-scroll-wrapper ${isAnimating ? 'digit-scroll-animating' : ''}`}>
      <div
        ref={containerRef}
        className="digit-scroll"
        style={{
          transform: "translateY(0%)",
        }}
      >
        {digitSequence.map((digit, i) => (
          <div key={i} className="digit">
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}
