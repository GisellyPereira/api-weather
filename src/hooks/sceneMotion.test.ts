import { describe, expect, it } from "vitest";
import { sceneEase, scenePalette } from "./useSceneMotion";
describe("transição do cenário", () => {
  it("começa e termina na paleta exata, sem ultrapassar os limites", () => {
    expect(sceneEase(-0.4)).toBe(0);
    expect(sceneEase(0)).toBe(0);
    expect(sceneEase(0.5)).toBeCloseTo(0.5);
    expect(sceneEase(1)).toBe(1);
    expect(sceneEase(1.4)).toBe(1);
    expect(sceneEase(0.1)).toBeLessThan(0.1);
    expect(sceneEase(0.9)).toBeGreaterThan(0.9);
  });
  it("distingue o céu ensolarado do chuvoso e mantém a iluminação noturna", () => {
    expect(scenePalette("clear", true)).not.toEqual(scenePalette("rain", true));
    expect(scenePalette("clear", false)).toEqual(scenePalette("rain", false));
    expect(scenePalette("clear", false)).not.toEqual(
      scenePalette("clear", true),
    );
  });
});
