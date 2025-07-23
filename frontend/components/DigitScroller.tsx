"use client";

import { useEffect, useRef, useState } from "react";
import "./animatedDigit.css";

interface DigitScrollerProps {
  prevDigit: string;
  digit: string;
  index: number;
  duration?: number; // in ms
}

const BASE_DURATION = 2000; // ms
const TOTAL_DIGITS = 6;
const MIN_STEPS = 8; // minimum steps for leftmost
const MAX_STEPS = 20; // maximum steps for rightmost

export default function DigitScroller({ prevDigit, digit, index, duration = BASE_DURATION }: DigitScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [digitArray, setDigitArray] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!/\d/.test(digit) || !/\d/.test(prevDigit) || digit === prevDigit) {
      if (scrollRef.current) {
        scrollRef.current.style.transition = "none";
        scrollRef.current.style.transform = `translateY(-${parseInt(digit) * 100}%)`;
      }
      setDigitArray([digit]);
      setIsAnimating(false);
      return;
    }

    const from = parseInt(prevDigit);
    const to = parseInt(digit);
    
    // Create a continuous sequence like a stopwatch
    let arr: string[] = [];
    let current = from;
    
    // Add the starting digit
    arr.push(current.toString());
    
    // Create a continuous sequence that goes through all numbers
    // For example: 5 -> 6 -> 7 -> 8 -> 9 -> 0 -> 1 -> 2 (if target is 2)
    while (current !== to) {
      current = (current + 1) % 10;
      arr.push(current.toString());
    }
    
    // Calculate animation speed based on position
    const steps = Math.max(
      MIN_STEPS,
      Math.round(
        MIN_STEPS + ((MAX_STEPS - MIN_STEPS) * (index / (TOTAL_DIGITS - 1)))
      )
    );
    
    // Adjust the sequence length to match the desired steps
    if (arr.length < steps) {
      // Repeat the sequence to make it longer
      const repeatCount = Math.ceil(steps / arr.length);
      const originalArr = [...arr];
      for (let i = 1; i < repeatCount; i++) {
        arr.push(...originalArr);
      }
    } else if (arr.length > steps) {
      // Trim the sequence to match steps
      arr = arr.slice(0, steps);
    }
    
    setDigitArray(arr);
    setIsAnimating(true);
    
    if (scrollRef.current) {
      // Reset position
      scrollRef.current.style.transition = "none";
      scrollRef.current.style.transform = `translateY(0%)`;
    }
    
    // Start the animation on next frame
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        scrollRef.current.style.transform = `translateY(-${(arr.length - 1) * 100}%)`;
      }
    });
    
    // After animation, snap to the final digit
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.style.transition = "none";
        scrollRef.current.style.transform = `translateY(0%)`;
      }
      setDigitArray([digit]);
      setIsAnimating(false);
    }, duration);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [prevDigit, digit, duration, index]);

  // For non-digit (e.g., decimal point), just render static
  if (!/\d/.test(digit)) {
    return <div className="digit-static">{digit}</div>;
  }

  return (
    <div className={`digit-scroll-wrapper ${isAnimating ? 'digit-scroll-animating' : ''}`}>
      <div
        ref={scrollRef}
        className="digit-scroll"
        style={{
          transform: `translateY(0%)`,
        }}
      >
        {digitArray.map((d, i) => (
          <div key={i} className="digit">{d}</div>
        ))}
      </div>
    </div>
  );
}
