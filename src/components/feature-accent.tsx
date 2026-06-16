import type { CSSProperties, ReactNode } from "react";

// Each feature gets its own shade of blue. Values are OKLCH so they work in
// light and dark mode (the lightness on --primary stays mid-range and pairs
// with the global --primary-foreground).
export type FeatureAccent =
  | "indigo"
  | "sky"
  | "cyan"
  | "azure"
  | "royal"
  | "navy";

const ACCENTS: Record<
  FeatureAccent,
  { hue: number; chroma: number; glowHue: number }
> = {
  indigo: { hue: 268, chroma: 0.2, glowHue: 280 },
  sky: { hue: 232, chroma: 0.17, glowHue: 220 },
  cyan: { hue: 215, chroma: 0.14, glowHue: 205 },
  azure: { hue: 248, chroma: 0.19, glowHue: 240 },
  royal: { hue: 262, chroma: 0.21, glowHue: 252 },
  navy: { hue: 255, chroma: 0.16, glowHue: 245 },
};

export function FeatureAccentProvider({
  accent,
  children,
  className,
}: {
  accent: FeatureAccent;
  children: ReactNode;
  className?: string;
}) {
  const { hue, chroma, glowHue } = ACCENTS[accent];
  const style = {
    "--primary": `oklch(0.55 ${chroma} ${hue})`,
    "--primary-glow": `oklch(0.72 ${chroma * 0.85} ${glowHue})`,
    "--ring": `oklch(0.55 ${chroma} ${hue})`,
    "--accent": `oklch(0.95 ${Math.min(chroma * 0.25, 0.05)} ${hue})`,
    "--accent-foreground": `oklch(0.35 ${chroma * 0.8} ${hue})`,
    "--gradient-primary": `linear-gradient(135deg, oklch(0.52 ${chroma} ${hue}), oklch(0.68 ${chroma * 0.9} ${glowHue}))`,
    "--shadow-elegant": `0 10px 30px -12px color-mix(in oklab, oklch(0.55 ${chroma} ${hue}) 30%, transparent)`,
  } as CSSProperties;

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
