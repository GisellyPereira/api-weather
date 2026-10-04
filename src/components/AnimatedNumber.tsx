import { useEffect, useRef, useState } from "react";
import { sceneEase } from "../hooks/useSceneMotion";
export default function AnimatedNumber({ value }: { value: number }) {
  const previous = useRef(value),
    [shown, setShown] = useState(value);
  useEffect(() => {
    const from = previous.current,
      reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      start: number | null = null;
    function render(time: number) {
      if (start === null) start = time;
      const progress = reduced.matches ? 1 : Math.min(1, (time - start) / 850);
      const next = Math.round(from + (value - from) * sceneEase(progress));
      previous.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{shown}</span>;
}
