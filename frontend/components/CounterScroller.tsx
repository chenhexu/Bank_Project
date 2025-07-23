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

// DigitRoller: animates a single digit rolling from prev to next
function DigitRoller({ prev, next, duration }: { prev: string; next: string; duration: number }) {
  const [digitArray, setDigitArray] = useState<string[]>([next]);
  const [rolling, setRolling] = useState(false);
  const rollerRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(prev);

  useEffect(() => {
    if (prev === next || prevRef.current === prev) {
      setDigitArray([next]);
      setRolling(false);
      prevRef.current = prev;
      return;
    }
    prevRef.current = prev;
    // Build the sequence of digits to roll through
    let arr: string[] = [];
    let from = parseInt(prev);
    let to = parseInt(next);
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
    requestAnimationFrame(() => {
      if (rollerRef.current) {
        rollerRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        rollerRef.current.style.transform = `translateY(-${(arr.length - 1) * 100}%)`;
      }
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
    return <span className="digit-static">{next}</span>;
  }
  return (
    <span className={`digit-scroll-wrapper${rolling ? ' digit-scroll-animating' : ''}`} style={{ display: 'inline-block' }}>
      <span
        ref={rollerRef}
        className="digit-scroll"
        style={{ display: 'flex', flexDirection: 'column', transform: 'translateY(0%)' }}
      >
        {digitArray.map((d, i) => (
          <span key={i} className="digit">{d}</span>
        ))}
      </span>
    </span>
  );
}

export default function CounterScroller({
  from,
  to,
  duration = 5000,
  minDigits = 6,
}: CounterScrollerProps) {
  const [displayValue, setDisplayValue] = useState(from);
  const [prevDigits, setPrevDigits] = useState<string[]>(from.toFixed(2).padStart(minDigits + 3, "0").split(""));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (from === to) {
      setDisplayValue(to);
      setPrevDigits(to.toFixed(2).padStart(minDigits + 3, "0").split(""));
      return;
    }
    let cancelled = false;
    const start = performance.now();
    const diff = to - from;
    const fps = 60;
    const totalFrames = Math.round((duration / 1000) * fps);
    let frame = 0;
    function animate(now: number) {
      if (cancelled) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Interpolate value for this frame
      const value = from + diff * progress;
      const formatted = value.toFixed(2).padStart(minDigits + 3, "0").split("");
      setDisplayValue(Number(value.toFixed(2)));
      setPrevDigits(prev => {
        // Only update prevDigits if the digit actually changed
        return prev.map((d, i) => (d !== formatted[i] ? d : formatted[i]));
      });
      frame++;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(Number(to.toFixed(2)));
        setPrevDigits(to.toFixed(2).padStart(minDigits + 3, "0").split(""));
      }
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, minDigits]);

  // Format and strip leading zeros
  let currStr = displayValue.toFixed(2).padStart(minDigits + 3, "0");
  currStr = stripLeadingZeros(currStr);
  const prevStr = stripLeadingZeros(prevDigits.join(""));

  return (
    <span
      style={{
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.05em",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <span className="select-none" style={{ marginRight: '0.2em', fontWeight: 900 }}>$</span>
      {currStr.split("").map((char, idx) =>
        char === "." ? (
          <span key={idx} className="mx-1 select-none">.</span>
        ) : (
          <DigitRoller
            key={idx + '-' + char + '-' + (prevStr[idx] || '0')}
            prev={prevStr[idx] || '0'}
            next={char}
            duration={duration / 3}
          />
        )
      )}
    </span>
  );
} 