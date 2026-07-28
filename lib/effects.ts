// Strain-intensity color scale: interpolated between the two brand colors
// (calm green -> hyper yellow) so "potency" badges stay on-brand instead of
// introducing new hues.
const INTENSITY_SCALE = ['#00A32E', '#40B223', '#80C217', '#BFD10C', '#FFE000'] as const;

export function intensityColor(intensity: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(intensity)));
  return INTENSITY_SCALE[clamped - 1]!;
}
