/** Moves a stepper by delta and keeps it between the first and the last step. */
export function stepTo(current: number, delta: number, count: number): number {
  return Math.min(count - 1, Math.max(0, current + delta));
}
