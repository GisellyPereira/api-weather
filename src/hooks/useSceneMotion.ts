import { useEffect, useRef, type RefObject } from "react";
import type { WeatherKind } from "../lib/weather";
type RGB = readonly [number, number, number];
type Palette = readonly [RGB, RGB, RGB];
const palettes: Record<string, Palette> = {
  night: [
    [16, 21, 47],
    [37, 35, 78],
    [62, 45, 97],
  ],
  clear: [
    [125, 174, 216],
    [181, 195, 232],
    [232, 212, 239],
  ],
  cloudy: [
    [144, 168, 204],
    [184, 187, 222],
    [220, 199, 230],
  ],
  rain: [
    [157, 169, 193],
    [176, 182, 208],
    [201, 190, 218],
  ],
  storm: [
    [156, 166, 191],
    [166, 171, 201],
    [191, 177, 212],
  ],
  snow: [
    [164, 190, 218],
    [202, 211, 235],
    [235, 224, 243],
  ],
  fog: [
    [155, 169, 194],
    [191, 194, 216],
    [220, 209, 233],
  ],
};
export function scenePalette(kind: WeatherKind, isDay: boolean): Palette {
  return isDay ? palettes[kind] : palettes.night;
}
const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
export function sceneEase(progress: number) {
  return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, progress)))) / 2;
}
export default function useSceneMotion(
  root: RefObject<HTMLDivElement | null>,
  sceneKey: string,
  palette: Palette,
  dayIndex: number,
) {
  const colors = useRef<Palette>(palettes.night),
    daylight = useRef(0),
    previousDay = useRef(dayIndex);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      from = colors.current,
      fromDaylight = daylight.current,
      toDaylight = palette === palettes.night ? 0 : 1;
    const direction = Math.sign(dayIndex - previousDay.current) || 1;
    previousDay.current = dayIndex;
    let frame = 0,
      start: number | null = null;
    function render(time: number) {
      if (start === null) start = time;
      const progress = reduced.matches ? 1 : Math.min(1, (time - start) / 1350),
        ease = sceneEase(progress);
      const result = from.map(
        (color, index) =>
          color.map((channel, channelIndex) =>
            mix(channel, palette[index][channelIndex], ease),
          ) as unknown as RGB,
      ) as unknown as Palette;
      colors.current = result;
      daylight.current = mix(fromDaylight, toDaylight, ease);
      element!.style.setProperty("--day-mix", `${daylight.current * 100}%`);
      ["top", "middle", "bottom"].forEach((name, index) =>
        element!.style.setProperty(
          `--sky-${name}`,
          `rgb(${result[index].map(Math.round).join(",")})`,
        ),
      );
      const lift = reduced.matches ? 0 : Math.sin(progress * Math.PI);
      element!.style.setProperty("--scene-lift", `${-lift * 22}px`);
      element!.style.setProperty(
        "--scene-turn",
        `${lift * direction * 2.4}deg`,
      );
      element!.style.setProperty("--scene-sweep", `${lift * direction * 75}px`);
      if (progress < 1) frame = requestAnimationFrame(render);
    }
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [root, sceneKey, palette, dayIndex]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      fine = matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0,
      x = 0,
      y = 0,
      tx = 0,
      ty = 0,
      last = 0;
    function render(time: number) {
      const dt = last ? Math.min(50, time - last) : 16;
      last = time;
      const follow = 1 - Math.exp(-dt / 85);
      x = mix(x, tx, follow);
      y = mix(y, ty, follow);
      element!.style.setProperty("--pointer-x", `${x}px`);
      element!.style.setProperty("--pointer-y", `${y}px`);
      frame = 0;
      if (Math.abs(x - tx) > 0.02 || Math.abs(y - ty) > 0.02)
        frame = requestAnimationFrame(render);
      else last = 0;
    }
    function request() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    function move(event: PointerEvent) {
      if (reduced.matches || !fine.matches || event.pointerType === "touch")
        return;
      tx = (event.clientX / innerWidth - 0.5) * 22;
      ty = (event.clientY / innerHeight - 0.5) * 14;
      request();
    }
    function reset() {
      tx = ty = 0;
      request();
    }
    function scroll() {
      element!.style.setProperty(
        "--scroll-depth",
        reduced.matches ? "0" : String(Math.min(1, scrollY / 650)),
      );
    }
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", scroll, { passive: true });
    reduced.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", scroll);
      reduced.removeEventListener("change", reset);
    };
  }, [root]);
}
