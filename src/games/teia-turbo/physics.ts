export type SwingInput = { x: number; y: number };

export type SwingState = {
  distance: number;
  offset: number;
  offsetVelocity: number;
  phase: number;
  heroY: number;
  stars: number;
  lastStar: number;
};

export const INITIAL_SWING_STATE: SwingState = {
  distance: 0,
  offset: 0,
  offsetVelocity: 0,
  phase: 0,
  heroY: 0.43,
  stars: 0,
  lastStar: -1,
};

const STAR_SPACING = 540;
const FIRST_STAR = 350;
const STAR_HEIGHTS = [0.31, 0.48, 0.58, 0.38, 0.52, 0.29, 0.46, 0.57];

export function starHeight(index: number): number {
  return STAR_HEIGHTS[index % STAR_HEIGHTS.length];
}

export function stepSwing(
  current: SwingState,
  input: SwingInput,
  deltaSeconds: number,
): SwingState {
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  const target = Math.max(-1, Math.min(1, input.x));
  const offsetAcceleration = (target - current.offset) * 22 - current.offsetVelocity * 8;
  const offsetVelocity = current.offsetVelocity + offsetAcceleration * dt;
  const offset = Math.max(-1, Math.min(1, current.offset + offsetVelocity * dt));
  const phase = current.phase + dt * (3.2 + input.x * 0.7);
  const heroY = Math.max(0.2, Math.min(0.68,
    0.43 + Math.sin(phase) * 0.085 - input.y * 0.055,
  ));
  const distance = current.distance + dt * (205 + input.y * 34);

  let stars = current.stars;
  let lastStar = current.lastStar;
  const firstCrossed = Math.max(0, Math.floor((current.distance - FIRST_STAR) / STAR_SPACING) + 1);
  const lastCrossed = Math.floor((distance - FIRST_STAR) / STAR_SPACING);
  for (let index = firstCrossed; index <= lastCrossed; index += 1) {
    if (Math.abs(heroY - starHeight(index)) < 0.22) stars += 1;
    lastStar = index;
  }

  return { distance, offset, offsetVelocity, phase, heroY, stars, lastStar };
}

export function starWorldPosition(index: number): number {
  return FIRST_STAR + index * STAR_SPACING;
}
