import { useEffect, useRef, useState } from "react";

interface CounterScrollerProps {
  from: number;
  to: number;
  duration?: number; // ms
  minDigits?: number; // e.g., 6 for 0000.00
}

function stripLeadingZeros(str: string) {
  // Remove leading zeros, but keep one zero before the decimal point if < 1
  if (str.startsWith("0.")) return str;
  const [intPart, decPart] = str.split(".");
  const stripped = String(Number(intPart));
  return decPart !== undefined ? `${stripped}.${decPart}` : stripped;
}

function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// DigitRoller: animates a single digit rolling from prev to next
function DigitRoller({ prev, next, duration }: { prev: string; next: string; duration: number }) {
  const [digitArray, setDigitArray] = useState<string[]>([prev]);
  const [rolling, setRolling] = useState(false);
  const rollerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(prev);

  useEffect(() => {
    if (prev === next) {
      setDigitArray([next]);
      setRolling(false);
      return;
    }
    prevRef.current = prev;
    // Build the sequence of digits to roll through
    const arr: string[] = [];
    let from = parseInt(prev);
    const to = parseInt(next);
    arr.push(from.toString());
    while (from !== to) {
      from = (from + 1) % 10;
      arr.push(from.toString());
    }
    setDigitArray(arr);
    setRolling(true);
    if (rollerRef.current) {
      rollerRef.current.style.transition = "none";
      rollerRef.current.style.transform = `translateY(0%)`;
    }
    // Start animation after two frames to guarantee initial paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (rollerRef.current) {
          rollerRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
          rollerRef.current.style.transform = `translateY(-${(arr.length - 1) * 100}%)`;
        }
      });
    });
    const timer = setTimeout(() => {
      setDigitArray([next]);
      setRolling(false);
      if (rollerRef.current) {
        rollerRef.current.style.transition = "none";
        rollerRef.current.style.transform = `translateY(0%)`;
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [prev, next, duration]);

  if (!/\d/.test(next)) {
    return <span>{next}</span>;
  }
  return (
    <span>
      {next}
    </span>
  );
}

export default function CounterScroller({
  from,
  to,
  duration = 1000,
  minDigits = 6,
}: CounterScrollerProps) {
  const [displayValue, setDisplayValue] = useState(from);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (from === to) {
      setDisplayValue(to);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = from;
    const endValue = to;
    const difference = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easeOutCubic);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <span
      style={{
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.05em",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        transition: isAnimating ? "none" : "all 0.3s ease",
      }}
    >
      <span className="select-none" style={{ marginRight: '0.2em', fontWeight: 900 }}>$</span>
      <span>{formatNumberWithCommas(displayValue)}</span>
    </span>
  );
} 